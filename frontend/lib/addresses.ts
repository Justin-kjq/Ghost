import { CLUSTER, PROGRAM_ID, USDC_MINT_STR } from "./config";

export const GITHUB_REPO = "https://github.com/Arnab-Afk/Ghost";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ghost.arnabbhowmik.in";

/** Known deployment fallbacks (see deployments.json). Used for explorer links. */
export const DEVNET = {
  program: "69gepJRrDXGgaKExaUHWmDjtLe4LHxTrNiGVzBGoTczR",
  mint: "GLfrBSjkzFQZJrWEcWfA9j1yapabGYTwdcNJKAgqWeCt",
  pool: "DbMcqri6ScZSnQBpDATapaWWUfUGTiytyMuzZrZKpZCr",
  vault: "GDhkKy7KupmP9w24XhinatErS8R6ejea95brgKX2z9uR",
};

export function explorerAddress(address: string) {
  if (CLUSTER === "localnet" || CLUSTER === "custom") return address;
  return `https://explorer.solana.com/address/${address}?cluster=${CLUSTER}`;
}

export function explorerTx(signature: string) {
  if (CLUSTER === "localnet" || CLUSTER === "custom") return signature;
  return `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`;
}

export function publicProgramId() {
  return PROGRAM_ID.toBase58();
}

export function publicMint() {
  return USDC_MINT_STR || (CLUSTER === "devnet" ? DEVNET.mint : "");
}
