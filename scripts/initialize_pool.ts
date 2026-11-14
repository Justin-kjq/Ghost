/**
 * Initialize Ghost pool after `anchor deploy`.
 *
 * Env: RPC_URL, AUTHORITY_KEYPAIR_PATH or ~/.config/solana/id.json,
 *      RELAYER_PUBKEY, USDC_MINT, PROGRAM_ID, FEE_BPS
 *
 * On Devnet the default relayer is the hosted fee-payer
 * EWpDhR9kvBtPSwhiGbqarjxsy97nJSE784HjzkQ9Lsxf
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
import { HOSTED_RELAYER_DEVNET, PROGRAM_ID as DEFAULT_PROGRAM_ID, poolPda } from "@ghost/sdk";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function loadKeypair(): Keypair {
  if (process.env.AUTHORITY_KEYPAIR_PATH && existsSync(process.env.AUTHORITY_KEYPAIR_PATH)) {
    return Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(readFileSync(process.env.AUTHORITY_KEYPAIR_PATH, "utf8"))),
    );
  }
  const path = join(homedir(), ".config", "solana", "id.json");
  if (!existsSync(path)) throw new Error("No AUTHORITY_KEYPAIR_PATH and no ~/.config/solana/id.json");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

async function main() {
  const authority = loadKeypair();
  const rpc = process.env.RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const programId = new PublicKey(process.env.PROGRAM_ID || DEFAULT_PROGRAM_ID);
  const mint = new PublicKey(process.env.USDC_MINT || "");
  const cluster = process.env.SOLANA_CLUSTER || "devnet";
  const defaultRelayer =
    cluster === "devnet" ? HOSTED_RELAYER_DEVNET : authority.publicKey.toBase58();
  const relayer = new PublicKey(process.env.RELAYER_PUBKEY || defaultRelayer);
  const feeBps = Number(process.env.FEE_BPS || 30);

  const wallet = new Wallet(authority);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idlPath = existsSync(join("target", "idl", "ghost_pool.json"))
    ? join("target", "idl", "ghost_pool.json")
    : join("relayer", "idl", "ghost_pool.json");
  const idl = JSON.parse(readFileSync(idlPath, "utf8"));
  idl.address = programId.toBase58();
  const program = new Program(idl, provider);

  const [pool] = poolPda(mint, programId);
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
  console.log("  cluster:", cluster);
  console.log("  pool:", pool.toBase58());
  console.log("  vault:", vault.toBase58());
  console.log("  treasury:", treasury.toBase58());
  console.log("  relayer:", relayer.toBase58());
  console.log("  tx:", sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
