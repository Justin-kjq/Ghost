/**
 * Transfer SOL from the local throwaway deployer to the hosted Devnet
 * relayer fee-payer (secret stays on the host).
 *
 *   RPC_URL=https://api.devnet.solana.com npx tsx scripts/fund_hosted_relayer.ts
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { HOSTED_RELAYER_DEVNET } from "@ghost/sdk";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function loadKeypair(): Keypair {
  if (process.env.AUTHORITY_KEYPAIR_PATH && existsSync(process.env.AUTHORITY_KEYPAIR_PATH)) {
    return Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(readFileSync(process.env.AUTHORITY_KEYPAIR_PATH, "utf8"))),
    );
  }
  const path = join(homedir(), ".config", "solana", "id.json");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

async function main() {
  const rpc = process.env.RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const payer = loadKeypair();
  const dest = new PublicKey(process.env.HOSTED_RELAYER_PUBKEY || HOSTED_RELAYER_DEVNET);
  const sol = Number(process.env.AMOUNT_SOL || "1.5");
  const lamports = Math.round(sol * LAMPORTS_PER_SOL);

  const bal = await connection.getBalance(payer.publicKey);
  console.log("payer:", payer.publicKey.toBase58(), "balance:", bal / LAMPORTS_PER_SOL, "SOL");
  console.log("dest: ", dest.toBase58());
  if (bal < lamports + 5000) {
    throw new Error(
      `Payer has ${bal / LAMPORTS_PER_SOL} SOL; need ~${sol} SOL. Fund the throwaway wallet first.`,
    );
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: dest,
      lamports,
    }),
  );
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  const cluster = process.env.SOLANA_CLUSTER || "devnet";
  console.log("transferred", sol, "SOL");
  console.log("tx:", sig);
  console.log(`explorer: https://explorer.solana.com/tx/${sig}?cluster=${cluster}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
