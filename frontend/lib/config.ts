import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID as DEFAULT_PROGRAM_ID } from "@ghost/sdk";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
export const RELAYER_URL =
  process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001";
export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || "devnet";
export const ENABLE_DEV_WALLET =
  process.env.NEXT_PUBLIC_ENABLE_DEV_WALLET === "true";
export const USDC_MINT_STR = process.env.NEXT_PUBLIC_USDC_MINT || "";
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || DEFAULT_PROGRAM_ID,
);

export function getUsdcMint(): PublicKey {
  const mint = process.env.NEXT_PUBLIC_USDC_MINT;
  if (!mint) throw new Error("Set NEXT_PUBLIC_USDC_MINT in frontend/.env.local");
  return new PublicKey(mint);
}
