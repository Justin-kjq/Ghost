/**
 * Create a mock USDC mint on the configured cluster and mint to the payer.
 *
 *   RPC_URL=https://api.devnet.solana.com npx tsx scripts/create_devnet_usdc.ts
 */
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Keypair } from "@solana/web3.js";
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
  if (!existsSync(path)) throw new Error("Missing ~/.config/solana/id.json — run solana-keygen new");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

async function main() {
  const payer = loadKeypair();
  const rpc = process.env.RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    6,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
  );
  const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, ata.address, payer, 1_000_000_000n);

  console.log("Mock USDC mint:", mint.toBase58());
  console.log("Your ATA:", ata.address.toBase58());
  console.log("Minted: 1000 USDC (6 decimals)");
  console.log("Payer:", payer.publicKey.toBase58());
  console.log("\nSet USDC_MINT / NEXT_PUBLIC_USDC_MINT to:", mint.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
