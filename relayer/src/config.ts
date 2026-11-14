import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@ghost/sdk";

export interface RelayerConfig {
  port: number;
  host: string;
  rpcUrl: string;
  cluster: string;
  programId: PublicKey;
  usdcMint: PublicKey | null;
  allowedOrigins: string[];
  keypairPath: string | undefined;
  secretKey: string | undefined;
  allowMockProof: boolean;
  rootHistorySize: number;
  dataDir: string;
}

function splitOrigins(raw: string | undefined): string[] {
  const fallback =
    "https://ghost.arnabbhowmik.in,http://localhost:3000,http://127.0.0.1:3000";
  return (raw || fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function loadConfig(): RelayerConfig {
  const rpcUrl = process.env.RPC_URL || "https://api.devnet.solana.com";
  const localhost =
    rpcUrl.includes("localhost") || rpcUrl.includes("127.0.0.1");
  return {
    port: Number(process.env.PORT || 3001),
    host: process.env.HOST || "0.0.0.0",
    rpcUrl,
    cluster: process.env.SOLANA_CLUSTER || (localhost ? "localnet" : "devnet"),
    programId: new PublicKey(process.env.PROGRAM_ID || PROGRAM_ID),
    usdcMint: process.env.USDC_MINT ? new PublicKey(process.env.USDC_MINT) : null,
    allowedOrigins: splitOrigins(process.env.ALLOWED_ORIGINS),
    keypairPath: process.env.RELAYER_KEYPAIR_PATH,
    secretKey: process.env.RELAYER_SECRET_KEY,
    allowMockProof: process.env.ALLOW_MOCK_PROOF === "1" && localhost,
    rootHistorySize: Number(process.env.ROOT_HISTORY_SIZE || 1024),
    dataDir: process.env.DATA_DIR || "",
  };
}

export function explorerTx(signature: string, cluster: string): string {
  if (cluster === "localnet" || cluster === "custom") {
    return signature;
  }
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export function explorerAddress(address: string, cluster: string): string {
  if (cluster === "localnet" || cluster === "custom") {
    return address;
  }
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}
