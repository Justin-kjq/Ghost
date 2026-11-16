import {
  CLUSTER,
  MAINNET_USDC_MINT,
  PROGRAM_ID,
  USDC_MINT_STR,
  isMainnetCluster,
} from "./config";

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

export const MAINNET = {
  /** Not deployed. Ghost Gas does not require the pool program. */
  program: "",
  mint: MAINNET_USDC_MINT,
  pool: "",
  vault: "",
};

/** Explorer cluster query; omit for mainnet so links resolve to production. */
export function explorerClusterQuery(cluster = CLUSTER): string {
  if (
    cluster === "localnet" ||
    cluster === "custom" ||
    isMainnetCluster(cluster)
  ) {
    return "";
  }
  return `?cluster=${cluster}`;
}

export function explorerAddress(address: string) {
  if (CLUSTER === "localnet" || CLUSTER === "custom") return address;
  return `https://explorer.solana.com/address/${address}${explorerClusterQuery()}`;
}

export function explorerTx(signature: string) {
  if (CLUSTER === "localnet" || CLUSTER === "custom") return signature;
  return `https://explorer.solana.com/tx/${signature}${explorerClusterQuery()}`;
}

export function publicProgramId() {
  return PROGRAM_ID.toBase58();
}

export function publicMint() {
  if (USDC_MINT_STR) return USDC_MINT_STR;
  if (CLUSTER === "devnet") return DEVNET.mint;
  if (isMainnetCluster()) return MAINNET.mint;
  return "";
}
