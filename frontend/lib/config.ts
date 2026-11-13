import { PublicKey } from "@solana/web3.js";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
export const RELAYER_URL =
  process.env.NEXT_PUBLIC_RELAYER_URL || "http://localhost:3001";
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
);

export function getUsdcMint(): PublicKey {
  const mint = process.env.NEXT_PUBLIC_USDC_MINT;
  if (!mint) throw new Error("Set NEXT_PUBLIC_USDC_MINT in frontend/.env.local");
  return new PublicKey(mint);
}
