/**
 * Local end-to-end: deposit a mock-USDC note, prove with the SDK, relayer
 * verifies Groth16 off-chain and submits a gasless withdraw to a fresh address.
 *
 *   npm run test:e2e
 *
 * Expects: solana-test-validator (started if missing), `anchor build` artifacts,
 * circuit wasm/zkey/vkey, and a funded ~/.config/solana/id.json on localnet.
 */
import { spawn } from "node:child_process";
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
} from "@solana/web3.js";
import {
  bigIntToBytes32,
  computePayout,
  createCommitment,
  encodeNote,
  generateWithdrawProof,
  leafPda,
  commitmentPda,
  nullifierPda,
  poolPda,
  PROGRAM_ID,
} from "@ghost/sdk";
import { buildApp } from "../relayer/src/app.ts";
import { loadConfig } from "../relayer/src/config.ts";
import { configureStore, replaceDeposits, rebuildRoots } from "../relayer/src/store.ts";

const RPC = process.env.RPC_URL || "http://127.0.0.1:8899";
const PROGRAM = new PublicKey(process.env.PROGRAM_ID || PROGRAM_ID);
const ROOT = join(import.meta.dirname, "..");
const WASM = join(ROOT, "frontend", "public", "zk", "merkle_proof.wasm");
const ZKEY = join(ROOT, "frontend", "public", "zk", "merkle_proof_final.zkey");
const SO = join(ROOT, "target", "deploy", "ghost_pool.so");
const PROG_KEY = join(ROOT, "keys", "ghost_pool-keypair.json");
const IDL = join(ROOT, "target", "idl", "ghost_pool.json");
const RELAYER_KEY = join(ROOT, ".keys", "e2e-relayer.json");

function loadKeypair(path: string): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

function saveKeypair(path: string, kp: Keypair) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify([...kp.secretKey]));
}

async function waitForRpc(connection: Connection, ms = 60_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      await connection.getLatestBlockhash();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`RPC ${RPC} not reachable`);
}

async function ensureValidator(connection: Connection) {
  try {
    await connection.getLatestBlockhash();
    console.log("local validator already running");
    return;
  } catch {
    console.log("starting solana-test-validator…");
    const child = spawn("solana-test-validator", ["--reset"], {
      stdio: "ignore",
      detached: true,
    });
    child.unref();
    await waitForRpc(connection);
  }
}

async function airdrop(connection: Connection, pk: PublicKey, sol = 100) {
  const sig = await connection.requestAirdrop(pk, sol * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, "confirmed");
}

async function main() {
  if (!existsSync(WASM) || !existsSync(ZKEY)) {
    throw new Error("Missing circuit artifacts — run npm run circuits:ptau && npm run circuits:build");
  }
  if (!existsSync(SO) || !existsSync(IDL)) {
    throw new Error("Missing program build — run npm run build:program");
  }

  const connection = new Connection(RPC, "confirmed");
  await ensureValidator(connection);

  const authorityPath = join(homedir(), ".config", "solana", "id.json");
  const authority = loadKeypair(authorityPath);
  if ((await connection.getBalance(authority.publicKey)) < 10 * LAMPORTS_PER_SOL) {
    await airdrop(connection, authority.publicKey, 100);
  }

  if (!existsSync(RELAYER_KEY)) {
    saveKeypair(RELAYER_KEY, Keypair.generate());
  }
  const relayerKp = loadKeypair(RELAYER_KEY);
  if ((await connection.getBalance(relayerKp.publicKey)) < 2 * LAMPORTS_PER_SOL) {
    await airdrop(connection, relayerKp.publicKey, 10);
  }

  mkdirSync(join(ROOT, "target", "deploy"), { recursive: true });
  const deployKey = join(ROOT, "target", "deploy", "ghost_pool-keypair.json");
  if (!existsSync(deployKey)) {
    writeFileSync(deployKey, readFileSync(PROG_KEY));
  }

  const info = await connection.getAccountInfo(PROGRAM);
  if (!info) {
    console.log("deploying ghost_pool to localnet…");
    const { execSync } = await import("node:child_process");
    execSync(
      `solana program deploy "${SO}" --program-id "${PROG_KEY}" --url ${RPC} --keypair "${authorityPath}"`,
      { stdio: "inherit" },
    );
  }

  const wallet = new Wallet(authority);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idl = JSON.parse(readFileSync(IDL, "utf8"));
  idl.address = PROGRAM.toBase58();
  const program = new Program(idl, provider);

  const mint = await createMint(connection, authority, authority.publicKey, null, 6);
  const [pool] = poolPda(mint, PROGRAM);
  const vault = getAssociatedTokenAddressSync(mint, pool, true);
  const treasuryOwner = Keypair.generate();
  const treasuryToken = getAssociatedTokenAddressSync(mint, treasuryOwner.publicKey);

  await program.methods
    .initialize(30, relayerKp.publicKey)
    .accounts({
      authority: authority.publicKey,
      mint,
      pool,
      vault,
      treasury: treasuryOwner.publicKey,
      treasuryToken,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  const depositorAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    mint,
    authority.publicKey,
  );
  await mintTo(connection, authority, mint, depositorAta.address, authority, 10_000_000n);

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

  const note = encodeNote(secret, nullifier, 0, commitment);
  const recipient = Keypair.generate();

  process.env.RPC_URL = RPC;
  process.env.SOLANA_CLUSTER = "localnet";
  process.env.PROGRAM_ID = PROGRAM.toBase58();
  process.env.USDC_MINT = mint.toBase58();
  process.env.RELAYER_KEYPAIR_PATH = RELAYER_KEY;
  process.env.ALLOWED_ORIGINS = "*";
  process.env.DATA_DIR = join(ROOT, ".keys", "e2e-relayer-data");
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

  const proof = await generateWithdrawProof(
    { note: { secret, nullifier, amount: "1000000", leafIndex: 0, commitment, raw: note }, path, recipient: recipient.publicKey.toBase58() },
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

  const recipientAta = getAssociatedTokenAddressSync(mint, recipient.publicKey);
  const rec = await getAccount(connection, recipientAta);
  const tre = await getAccount(connection, treasuryToken);
  const vaultAcc = await getAccount(connection, vault);
  const { fee, payout } = computePayout();
  if (rec.amount !== payout) throw new Error(`recipient got ${rec.amount}, expected ${payout}`);
  if (tre.amount !== fee) throw new Error(`treasury got ${tre.amount}, expected ${fee}`);
  if (vaultAcc.amount !== 0n) throw new Error(`vault leftover ${vaultAcc.amount}`);
  if ((await connection.getBalance(recipient.publicKey)) === 0) {
    console.log("recipient has 0 SOL (gasless) ✓");
  }

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
  console.log("\nE2E localnet OK");
  console.log("  program:", PROGRAM.toBase58());
  console.log("  mint:", mint.toBase58());
  console.log("  pool:", pool.toBase58());
  console.log("  deposit:", depositSig);
  console.log("  withdraw:", withdrawBody.signature);
  console.log("  recipient:", recipient.publicKey.toBase58(), `balance=${rec.amount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
