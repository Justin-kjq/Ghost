/**
 * Initialize Ghost pool on Devnet after `anchor deploy`.
 *
 * Usage:
 *   npx tsx scripts/initialize_pool.ts
 *
 * Env:
 *   RPC_URL, AUTHORITY_SECRET_KEY (or ~/.config/solana/id.json),
 *   RELAYER_PUBKEY, USDC_MINT, PROGRAM_ID, FEE_BPS
 */
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
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import bs58 from "bs58";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function loadKeypair(): Keypair {
  if (process.env.AUTHORITY_SECRET_KEY) {
    const s = process.env.AUTHORITY_SECRET_KEY;
    if (s.startsWith("[")) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(s)));
    return Keypair.fromSecretKey(bs58.decode(s));
  }
  const path = join(homedir(), ".config", "solana", "id.json");
  if (!existsSync(path)) throw new Error("No AUTHORITY_SECRET_KEY and no ~/.config/solana/id.json");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

async function main() {
  const authority = loadKeypair();
  const connection = new Connection(process.env.RPC_URL || "https://api.devnet.solana.com", "confirmed");
  const programId = new PublicKey(
    process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
  );
  const mint = new PublicKey(process.env.USDC_MINT || "");
  const relayer = new PublicKey(process.env.RELAYER_PUBKEY || authority.publicKey.toBase58());
  const feeBps = Number(process.env.FEE_BPS || 30);

  const wallet = new Wallet(authority);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idl = JSON.parse(readFileSync(join("target", "idl", "ghost_pool.json"), "utf8"));
  idl.address = programId.toBase58();
  const program = new Program(idl, provider);

  const [pool] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), mint.toBuffer()],
    programId,
  );
  const vault = getAssociatedTokenAddressSync(mint, pool, true);
  const treasury = authority.publicKey;
  const treasuryToken = getAssociatedTokenAddressSync(mint, treasury);

  const sig = await program.methods
    .initialize(feeBps, relayer)
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

  console.log("Pool initialized");
  console.log("  pool:", pool.toBase58());
  console.log("  vault:", vault.toBase58());
  console.log("  treasury:", treasury.toBase58());
  console.log("  tx:", sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
