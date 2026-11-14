/**
 * Devnet end-to-end: deploy (if needed), mint mock USDC, initialize the pool
 * with the hosted fee-payer as `pool.relayer`, then run deposit → Groth16 →
 * gasless withdraw via a *local* relayer key (rotated in, then rotated back).
 *
 *   AUTHORITY_KEYPAIR_PATH=.keys/devnet-deployer.json \
 *     RPC_URL=https://api.devnet.solana.com \
 *     npx tsx scripts/e2e_devnet.ts
 *
 * Never prints or commits the deployer secret.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  HOSTED_RELAYER_DEVNET,
  PROGRAM_ID,
  bigIntToBytes32,
  computePayout,
  createCommitment,
  encodeNote,
  generateWithdrawProof,
  leafPda,
  commitmentPda,
  poolPda,
} from "@ghost/sdk";
import { buildApp } from "../relayer/src/app.ts";
import { loadConfig } from "../relayer/src/config.ts";
import { configureStore, replaceDeposits, rebuildRoots } from "../relayer/src/store.ts";

const RPC = process.env.RPC_URL || "https://api.devnet.solana.com";
const CLUSTER = process.env.SOLANA_CLUSTER || "devnet";
const PROGRAM = new PublicKey(process.env.PROGRAM_ID || PROGRAM_ID);
const HOSTED_RELAYER = new PublicKey(
  process.env.RELAYER_PUBKEY || HOSTED_RELAYER_DEVNET,
);
const ROOT = join(import.meta.dirname, "..");
const WASM = join(ROOT, "frontend", "public", "zk", "merkle_proof.wasm");
const ZKEY = join(ROOT, "frontend", "public", "zk", "merkle_proof_final.zkey");
const SO = join(ROOT, "target", "deploy", "ghost_pool.so");
const PROG_KEY = join(ROOT, "keys", "ghost_pool-keypair.json");
const IDL_CANDIDATES = [
  join(ROOT, "target", "idl", "ghost_pool.json"),
  join(ROOT, "relayer", "idl", "ghost_pool.json"),
];
const RELAYER_KEY = join(ROOT, ".keys", "devnet-e2e-relayer.json");
const DEPLOYMENTS = join(ROOT, "deployments.json");
const EXPLORER = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=${CLUSTER}`;
const ADDR = (pk: string) =>
  `https://explorer.solana.com/address/${pk}?cluster=${CLUSTER}`;

function loadKeypair(path: string): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

function saveKeypair(path: string, kp: Keypair) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify([...kp.secretKey]), { mode: 0o600 });
}

function authorityPath(): string {
  if (process.env.AUTHORITY_KEYPAIR_PATH && existsSync(process.env.AUTHORITY_KEYPAIR_PATH)) {
    return process.env.AUTHORITY_KEYPAIR_PATH;
  }
  const home = join(homedir(), ".config", "solana", "id.json");
  if (!existsSync(home)) throw new Error("Set AUTHORITY_KEYPAIR_PATH");
  return home;
}

function explorerFromDeployOutput(output: string): string {
  const m =
    output.match(/Program Id:\s+\S+[\s\S]*?Signature:\s+([1-9A-HJ-NP-Za-km-z]{32,88})/) ||
    output.match(/Signature:\s+([1-9A-HJ-NP-Za-km-z]{32,88})/);
  return m?.[1] ?? "";
}

async function deployIfNeeded(connection: Connection, authorityFile: string): Promise<string> {
  const info = await connection.getAccountInfo(PROGRAM);
  if (info) {
    console.log("program already on", CLUSTER, PROGRAM.toBase58());
    return "";
  }
  if (!existsSync(SO)) throw new Error("Missing ghost_pool.so — run npm run build:program");
  mkdirSync(join(ROOT, "target", "deploy"), { recursive: true });
  const deployKey = join(ROOT, "target", "deploy", "ghost_pool-keypair.json");
  if (!existsSync(deployKey)) writeFileSync(deployKey, readFileSync(PROG_KEY));

  console.log("deploying ghost_pool to", CLUSTER, "…");
  const output = execSync(
    `solana program deploy "${SO}" --program-id "${PROG_KEY}" --url ${RPC} --keypair "${authorityFile}" --commitment confirmed`,
    { encoding: "utf8" },
  );
  process.stdout.write(output);
  const parsed = explorerFromDeployOutput(output);
  if (parsed) return parsed;
  const sigs = await connection.getSignaturesForAddress(PROGRAM, { limit: 5 });
  return sigs[0]?.signature ?? "";
}

function loadIdl(): any {
  const path = IDL_CANDIDATES.find((p) => existsSync(p));
  if (!path) throw new Error("Missing IDL");
  const idl = JSON.parse(readFileSync(path, "utf8"));
  idl.address = PROGRAM.toBase58();
  return idl;
}

function writeDeployments(patch: Record<string, unknown>) {
  const current = existsSync(DEPLOYMENTS)
    ? JSON.parse(readFileSync(DEPLOYMENTS, "utf8"))
    : {};
  const cluster = {
    ...(current[CLUSTER] || {}),
    programId: PROGRAM.toBase58(),
    relayer: HOSTED_RELAYER.toBase58(),
    ...patch,
  };
  writeFileSync(
    DEPLOYMENTS,
    JSON.stringify(
      {
        ...current,
        programId: PROGRAM.toBase58(),
        hostedRelayerDevnet: HOSTED_RELAYER.toBase58(),
        [CLUSTER]: cluster,
      },
      null,
      2,
    ) + "\n",
  );
}

async function main() {
  if (!existsSync(WASM) || !existsSync(ZKEY)) {
    throw new Error("Missing circuit artifacts — run npm run circuits:ptau && npm run circuits:build");
  }

  const authFile = authorityPath();
  const authority = loadKeypair(authFile);
  console.log("operator:", authority.publicKey.toBase58());

  const connection = new Connection(RPC, "confirmed");
  const bal = await connection.getBalance(authority.publicKey);
  console.log("operator balance:", bal / LAMPORTS_PER_SOL, "SOL");
  if (bal < 0.5 * LAMPORTS_PER_SOL) {
    throw new Error("Operator has insufficient Devnet SOL");
  }

  const deployTx = await deployIfNeeded(connection, authFile);
  if (deployTx) {
    console.log("deploy tx:", deployTx);
    console.log("  explorer:", EXPLORER(deployTx));
  }

  const wallet = new Wallet(authority);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program(loadIdl(), provider);

  const mint = await createMint(connection, authority, authority.publicKey, null, 6);
  console.log("mock USDC mint:", mint.toBase58());

  const [pool] = poolPda(mint, PROGRAM);
  const vault = getAssociatedTokenAddressSync(mint, pool, true);
  const treasury = authority.publicKey;
  const treasuryToken = getAssociatedTokenAddressSync(mint, treasury);

  const initSig = await program.methods
    .initialize(30, HOSTED_RELAYER)
    .accounts({
      authority: authority.publicKey,
      mint,
      pool,
      vault,
      treasury,
      treasuryToken,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
  console.log("pool initialized with hosted relayer", HOSTED_RELAYER.toBase58());
  console.log("  pool:", pool.toBase58());
  console.log("  init tx:", initSig);
  console.log("  explorer:", EXPLORER(initSig));

  writeDeployments({
    usdcMint: mint.toBase58(),
    pool: pool.toBase58(),
    vault: vault.toBase58(),
    treasury: treasury.toBase58(),
    deployTx: deployTx || undefined,
    initTx: initSig,
    note: "Hosted relayer EWpD is pool.relayer. Demo withdraw used a local throwaway key via set_relayer, then rotated back.",
  });

  if (!existsSync(RELAYER_KEY)) {
    saveKeypair(RELAYER_KEY, Keypair.generate());
  }
  const relayerKp = loadKeypair(RELAYER_KEY);
  console.log("local demo relayer:", relayerKp.publicKey.toBase58());
  const relayerBal = await connection.getBalance(relayerKp.publicKey);
  if (relayerBal < 0.4 * LAMPORTS_PER_SOL) {
    const fund = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: relayerKp.publicKey,
        lamports: Math.round(0.5 * LAMPORTS_PER_SOL),
      }),
    );
    const fundSig = await sendAndConfirmTransaction(connection, fund, [authority], {
      commitment: "confirmed",
    });
    console.log("funded local demo relayer 0.5 SOL:", fundSig);
  }

  const rotateIn = await program.methods
    .setRelayer(relayerKp.publicKey)
    .accounts({ authority: authority.publicKey, pool })
    .rpc();
  console.log("set_relayer → local demo key:", rotateIn);

  const depositorAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    mint,
    authority.publicKey,
  );
  await mintTo(connection, authority, mint, depositorAta.address, authority, 100_000_000n);

  const { secret, nullifier, commitment } = await createCommitment();
  const commitmentBytes = bigIntToBytes32(commitment);
  const [commitmentRecord] = commitmentPda(commitmentBytes, PROGRAM);
  const [leafRecord] = leafPda(mint, 0, PROGRAM);

  const depositSig = await program.methods
    .deposit(commitmentBytes)
    .accounts({
      depositor: authority.publicKey,
      pool,
      vault,
      depositorToken: depositorAta.address,
      commitmentRecord,
      leafRecord,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("deposit tx:", depositSig);
  console.log("  explorer:", EXPLORER(depositSig));

  const note = encodeNote(secret, nullifier, 0, commitment);
  const recipient = Keypair.generate();
  console.log("fresh recipient (0 SOL):", recipient.publicKey.toBase58());

  process.env.RPC_URL = RPC;
  process.env.SOLANA_CLUSTER = CLUSTER;
  process.env.PROGRAM_ID = PROGRAM.toBase58();
  process.env.USDC_MINT = mint.toBase58();
  process.env.RELAYER_KEYPAIR_PATH = RELAYER_KEY;
  process.env.ALLOWED_ORIGINS = "*";
  process.env.DATA_DIR = join(ROOT, ".keys", "devnet-relayer-data");
  process.env.PORT = process.env.PORT || "3001";

  const cfg = loadConfig();
  configureStore(cfg.dataDir);
  replaceDeposits([]);
  await rebuildRoots();

  const app = await buildApp({}, cfg);

  const register = await app.inject({
    method: "POST",
    url: "/v1/deposits",
    payload: {
      leafIndex: 0,
      commitment: "0x" + commitment.toString(16).padStart(64, "0"),
      txSignature: depositSig,
    },
  });
  if (register.statusCode !== 200) {
    throw new Error(`register deposit failed: ${register.body}`);
  }

  const pathRes = await app.inject({ method: "GET", url: "/v1/merkle-path/0" });
  if (pathRes.statusCode !== 200) throw new Error(`merkle path failed: ${pathRes.body}`);
  const pathJson = pathRes.json();
  const path = {
    pathElements: pathJson.pathElements.map((x: string) => BigInt(x)),
    pathIndices: pathJson.pathIndices as number[],
    root: BigInt(pathJson.root),
  };

  console.log("generating Groth16 proof…");
  const proof = await generateWithdrawProof(
    {
      note: { secret, nullifier, amount: "1000000", leafIndex: 0, commitment, raw: note },
      path,
      recipient: recipient.publicKey.toBase58(),
    },
    WASM,
    ZKEY,
  );

  const withdrawRes = await app.inject({
    method: "POST",
    url: "/v1/withdraw",
    payload: {
      recipient: recipient.publicKey.toBase58(),
      proof: proof.proof,
      publicSignals: proof.publicSignals,
    },
  });
  if (withdrawRes.statusCode !== 200) {
    throw new Error(`withdraw failed: ${withdrawRes.body}`);
  }
  const withdrawBody = withdrawRes.json();
  console.log("withdraw tx:", withdrawBody.signature);
  console.log("  explorer:", EXPLORER(withdrawBody.signature));

  const recipientAta = getAssociatedTokenAddressSync(mint, recipient.publicKey);
  const rec = await getAccount(connection, recipientAta);
  const tre = await getAccount(connection, treasuryToken);
  const vaultAcc = await getAccount(connection, vault);
  const { fee, payout } = computePayout();
  if (rec.amount !== payout) throw new Error(`recipient got ${rec.amount}, expected ${payout}`);
  // Treasury ATA may also be the depositor mint destination (operator == treasury).
  if (tre.amount < fee) throw new Error(`treasury got ${tre.amount}, expected at least ${fee}`);
  if (vaultAcc.amount !== 0n) throw new Error(`vault leftover ${vaultAcc.amount}`);
  const recSol = await connection.getBalance(recipient.publicKey);
  if (recSol !== 0) throw new Error(`recipient should have 0 SOL, has ${recSol}`);
  console.log("recipient has 0 SOL (gasless) ✓  payout", rec.amount.toString());

  const dup = await app.inject({
    method: "POST",
    url: "/v1/withdraw",
    payload: {
      recipient: recipient.publicKey.toBase58(),
      proof: proof.proof,
      publicSignals: proof.publicSignals,
    },
  });
  if (dup.statusCode === 200) throw new Error("double-spend succeeded — fail");
  console.log("double-spend rejected ✓");

  await app.close();

  const keepLocal = process.env.KEEP_LOCAL_RELAYER === "1";
  let rotateOut = "";
  if (keepLocal) {
    console.log("KEEP_LOCAL_RELAYER=1 — leaving local demo key authorized for the UI recording");
  } else {
    rotateOut = await program.methods
      .setRelayer(HOSTED_RELAYER)
      .accounts({ authority: authority.publicKey, pool })
      .rpc();
    console.log("set_relayer → hosted EWpD:", rotateOut);
    console.log("  explorer:", EXPLORER(rotateOut));
    const poolAcc: any = await (program.account as any).poolConfig.fetch(pool);
    if (poolAcc.relayer.toBase58() !== HOSTED_RELAYER.toBase58()) {
      throw new Error("pool.relayer was not restored to hosted fee-payer");
    }
  }

  writeDeployments({
    usdcMint: mint.toBase58(),
    pool: pool.toBase58(),
    vault: vault.toBase58(),
    treasury: treasury.toBase58(),
    deployTx: deployTx || undefined,
    initTx: initSig,
    depositTx: depositSig,
    withdrawTx: withdrawBody.signature,
    setRelayerLocalTx: rotateIn,
    setRelayerHostedTx: rotateOut || undefined,
    recipient: recipient.publicKey.toBase58(),
    demoRelayer: relayerKp.publicKey.toBase58(),
    explorer: {
      program: ADDR(PROGRAM.toBase58()),
      mint: ADDR(mint.toBase58()),
      pool: ADDR(pool.toBase58()),
      deploy: deployTx ? EXPLORER(deployTx) : ADDR(PROGRAM.toBase58()),
      init: EXPLORER(initSig),
      deposit: EXPLORER(depositSig),
      withdraw: EXPLORER(withdrawBody.signature),
      setRelayerHosted: rotateOut ? EXPLORER(rotateOut) : undefined,
    },
    note: keepLocal
      ? "Demo withdraw used a local throwaway fee-payer. Hosted EWpD is the intended pool.relayer; restore with scripts/set_relayer.ts after the UI recording."
      : "Hosted relayer EWpDhR9kvBtPSwhiGbqarjxsy97nJSE784HjzkQ9Lsxf is pool.relayer. The gasless withdraw demo used a local throwaway fee-payer via set_relayer, then rotated back so the host key is authorized.",
  });

  const envLocal = [
    "NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com",
    "NEXT_PUBLIC_CLUSTER=devnet",
    "NEXT_PUBLIC_RELAYER_URL=http://localhost:3001",
    `NEXT_PUBLIC_PROGRAM_ID=${PROGRAM.toBase58()}`,
    `NEXT_PUBLIC_USDC_MINT=${mint.toBase58()}`,
    "NEXT_PUBLIC_ENABLE_DEV_WALLET=true",
    "",
  ].join("\n");
  writeFileSync(join(ROOT, "frontend", ".env.local"), envLocal);

  console.log("\nE2E Devnet OK");
  console.log("  program:", PROGRAM.toBase58(), ADDR(PROGRAM.toBase58()));
  console.log("  mint:", mint.toBase58());
  console.log("  pool:", pool.toBase58());
  console.log("  hosted relayer:", HOSTED_RELAYER.toBase58());
  console.log("  deposit:", EXPLORER(depositSig));
  console.log("  withdraw:", EXPLORER(withdrawBody.signature));
  console.log("  recipient:", recipient.publicKey.toBase58(), `balance=${rec.amount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
