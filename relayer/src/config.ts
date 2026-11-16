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
  /** Ghost Gas: sponsor feePayer for allowlisted SPL transfers. */
  gasEnabled: boolean;
  gasMaxPerHour: number;
  /** null = any SPL mint; otherwise allowlist of base58 mints. */
  gasAllowedMints: string[] | null;
  /** Flat USDC base-unit fee debited from prepaid gas note per sponsored tx. */
  gasCreditFeeRaw: string;
  /** Optional override for gas credit treasury ATA; default = relayer USDC ATA. */
  gasTreasury: PublicKey | null;
  /**
   * Accept SOL / any SPL for credit top-up, priced to USDC via Jupiter.
   * Default on. Set GAS_MULTI_ASSET=0 to force USDC-only deposits.
   */
  gasMultiAsset: boolean;
  /** Haircut on quoted USDC (bps). 200 = credit 98% of Jupiter outAmount. */
  gasCreditHaircutBps: number;
  /**
   * Allowlist for deposit assets (base58 mints; use "native" for SOL).
   * Empty/unset → safe default (native + USDC [+ USDT on mainnet]), not open-ended.
   */
  gasCreditDepositMints: string[] | null;
  /**
   * Mint used as the USD quote currency for Jupiter (defaults to Circle mainnet USDC
   * when cluster is mainnet; otherwise USDC_MINT).
   */
  gasQuoteUsdcMint: PublicKey | null;
}

function splitOrigins(raw: string | undefined): string[] {
  const fallback =
    "https://ghost.arnabbhowmik.in,http://localhost:3000,http://127.0.0.1:3000";
  return (raw || fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseMintAllowlist(raw: string | undefined): string[] | null {
  if (raw === undefined || raw.trim() === "") return null;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : null;
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
    gasEnabled: process.env.GAS_ENABLED !== "0",
    gasMaxPerHour: Number(process.env.GAS_MAX_PER_HOUR || 30),
    gasAllowedMints: parseMintAllowlist(process.env.GAS_ALLOWED_MINTS),
    gasCreditFeeRaw: process.env.GAS_CREDIT_FEE_RAW || "10000", // 0.01 USDC @ 6 decimals
    gasTreasury: process.env.GAS_TREASURY
      ? new PublicKey(process.env.GAS_TREASURY)
      : null,
    gasMultiAsset: process.env.GAS_MULTI_ASSET !== "0",
    gasCreditHaircutBps: (() => {
      const n = Number(process.env.GAS_CREDIT_HAIRCUT_BPS || "200");
      return Number.isFinite(n) ? n : 200;
    })(),
    gasCreditDepositMints: parseMintAllowlist(
      process.env.GAS_CREDIT_DEPOSIT_MINTS,
    ),
    gasQuoteUsdcMint: process.env.GAS_QUOTE_USDC_MINT
      ? new PublicKey(process.env.GAS_QUOTE_USDC_MINT)
      : null,
  };
}

function explorerClusterQuery(cluster: string): string {
  if (
    cluster === "localnet" ||
    cluster === "custom" ||
    cluster === "mainnet-beta" ||
    cluster === "mainnet"
  ) {
    return "";
  }
  return `?cluster=${cluster}`;
}

export function explorerTx(signature: string, cluster: string): string {
  if (cluster === "localnet" || cluster === "custom") {
    return signature;
  }
  return `https://explorer.solana.com/tx/${signature}${explorerClusterQuery(cluster)}`;
}

export function explorerAddress(address: string, cluster: string): string {
  if (cluster === "localnet" || cluster === "custom") {
    return address;
  }
  return `https://explorer.solana.com/address/${address}${explorerClusterQuery(cluster)}`;
}
