import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bigIntToBytes32 } from "@ghost/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadRelayerKeypair(): Keypair {
  const secret = process.env.RELAYER_SECRET_KEY;
  if (!secret) throw new Error("Missing RELAYER_SECRET_KEY");
  if (secret.startsWith("[")) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
  }
  return Keypair.fromSecretKey(bs58.decode(secret));
}

export function getConnection(): Connection {
  return new Connection(process.env.RPC_URL || "https://api.devnet.solana.com", "confirmed");
}

export function getProgramId(): PublicKey {
  return new PublicKey(
    process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
  );
}

export function getMint(): PublicKey {
  if (!process.env.USDC_MINT) throw new Error("Missing USDC_MINT");
  return new PublicKey(process.env.USDC_MINT);
}

export function poolPda(mint: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("pool"), mint.toBuffer()], programId);
}

export function commitmentPda(
  commitment: Uint8Array | number[],
  programId: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("commitment"), Buffer.from(commitment)],
    programId,
  );
}

export function nullifierPda(
  nullifier: Uint8Array | number[],
  programId: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("nullifier"), Buffer.from(nullifier)],
    programId,
  );
}

function loadIdl(): any {
  const local = join(__dirname, "..", "idl", "ghost_pool.json");
  const fallback = join(__dirname, "..", "..", "target", "idl", "ghost_pool.json");
  const path = existsSync(local) ? local : fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function getProgram(payer: Keypair): Program {
  const connection = getConnection();
  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idl = loadIdl();
  idl.address = getProgramId().toBase58();
  return new Program(idl, provider);
}

export async function submitWithdraw(params: {
  nullifier: bigint;
  root: bigint;
  recipient: PublicKey;
}): Promise<string> {
  const relayer = loadRelayerKeypair();
  const program = getProgram(relayer);
  const mint = getMint();
  const programId = getProgramId();
  const [pool] = poolPda(mint, programId);
  const poolAccount: any = await (program.account as any).poolConfig.fetch(pool);

  const nullifierBytes = bigIntToBytes32(params.nullifier);
  const rootBytes = bigIntToBytes32(params.root);
  const [nullifierRecord] = nullifierPda(nullifierBytes, programId);

  const recipientToken = getAssociatedTokenAddressSync(mint, params.recipient);
  const treasuryToken = getAssociatedTokenAddressSync(mint, poolAccount.treasury as PublicKey);

  const tx = await program.methods
    .withdraw(nullifierBytes, rootBytes)
    .accounts({
      relayer: relayer.publicKey,
      pool,
      vault: poolAccount.vault,
      recipient: params.recipient,
      recipientToken,
      treasury: poolAccount.treasury,
      treasuryToken,
      nullifierRecord,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .transaction();

  // Ensure recipient ATA exists — create if needed (relayer pays)
  const connection = getConnection();
  const info = await connection.getAccountInfo(recipientToken);
  const ixs = [];
  if (!info) {
    const { createAssociatedTokenAccountInstruction } = await import("@solana/spl-token");
    ixs.push(
      createAssociatedTokenAccountInstruction(
        relayer.publicKey,
        recipientToken,
        params.recipient,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  const finalTx = new Transaction().add(...ixs, ...tx.instructions);
  finalTx.feePayer = relayer.publicKey;
  finalTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  finalTx.sign(relayer);
  const sig = await connection.sendRawTransaction(finalTx.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

export async function fetchPool() {
  const relayer = loadRelayerKeypair();
  const program = getProgram(relayer);
  const mint = getMint();
  const [pool] = poolPda(mint, getProgramId());
  const account: any = await (program.account as any).poolConfig.fetch(pool);
  return {
    address: pool.toBase58(),
    authority: account.authority.toBase58(),
    relayer: account.relayer.toBase58(),
    mint: account.mint.toBase58(),
    vault: account.vault.toBase58(),
    treasury: account.treasury.toBase58(),
    denomination: account.denomination?.toString?.() ?? String(account.denomination),
    feeBps: account.feeBps,
    nextIndex: account.nextIndex,
    depositCount: account.depositCount,
  };
}
