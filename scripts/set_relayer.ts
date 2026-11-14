/**
 * Rotate pool.relayer. Used to restore the hosted Devnet fee-payer after a
 * local demo key was temporarily authorized.
 *
 *   AUTHORITY_KEYPAIR_PATH=.keys/devnet-deployer.json \
 *     USDC_MINT=<mint> RELAYER_PUBKEY=EWpDhR9kvBtPSwhiGbqarjxsy97nJSE784HjzkQ9Lsxf \
 *     RPC_URL=https://api.devnet.solana.com \
 *     npx tsx scripts/set_relayer.ts
 */
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { HOSTED_RELAYER_DEVNET, PROGRAM_ID, poolPda } from "@ghost/sdk";
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
  const authority = loadKeypair();
  const rpc = process.env.RPC_URL || "https://api.devnet.solana.com";
  const cluster = process.env.SOLANA_CLUSTER || "devnet";
  const programId = new PublicKey(process.env.PROGRAM_ID || PROGRAM_ID);
  const mint = new PublicKey(process.env.USDC_MINT || "");
  const relayer = new PublicKey(process.env.RELAYER_PUBKEY || HOSTED_RELAYER_DEVNET);
  const connection = new Connection(rpc, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(authority), {
    commitment: "confirmed",
  });
  const idlPath = existsSync(join("target", "idl", "ghost_pool.json"))
    ? join("target", "idl", "ghost_pool.json")
    : join("relayer", "idl", "ghost_pool.json");
  const idl = JSON.parse(readFileSync(idlPath, "utf8"));
  idl.address = programId.toBase58();
  const program = new Program(idl, provider);
  const [pool] = poolPda(mint, programId);
  const sig = await program.methods
    .setRelayer(relayer)
    .accounts({ authority: authority.publicKey, pool })
    .rpc();
  const acc: any = await (program.account as any).poolConfig.fetch(pool);
  console.log("pool:", pool.toBase58());
  console.log("relayer:", acc.relayer.toBase58());
  console.log("tx:", sig);
  console.log(`explorer: https://explorer.solana.com/tx/${sig}?cluster=${cluster}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
