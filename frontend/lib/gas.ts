import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { RELAYER_URL, RPC_URL, CLUSTER } from "./config";
import { explorerTx } from "./addresses";

export type GasConfig = {
  enabled: boolean;
  feePayer: string;
  maxPerHour: number;
  allowedMints: string[] | null;
  creditFeeRaw: string;
  usdcMint: string | null;
  treasury: string | null;
};

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

export async function fetchGasConfig(): Promise<GasConfig> {
  const res = await fetch(`${RELAYER_URL}/v1/gas/config`, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load Ghost Gas config");
  return res.json();
}

export async function fetchMintDecimals(mint: string): Promise<number> {
  const connection = new Connection(RPC_URL, "confirmed");
  const pk = new PublicKey(mint);
  const info = await connection.getAccountInfo(pk);
  if (!info) throw new Error("Mint not found");
  const program =
    info.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const m = await getMint(connection, pk, "confirmed", program);
  return m.decimals;
}

/**
 * Prepare + sign + submit a Ghost-sponsored SPL transfer.
 * Debits prepaid gas note (X1 credit) and pays SOL as feePayer.
 */
export async function sponsoredTransfer(params: {
  from: string;
  to: string;
  mint: string;
  amountRaw: string;
  gasNote: string;
  signTransaction: <T extends Transaction>(tx: T) => Promise<T>;
}): Promise<{ signature: string; explorer: string; creditRemaining: string }> {
  const prepRes = await fetch(`${RELAYER_URL}/v1/gas/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      mint: params.mint,
      amount: params.amountRaw,
      gasNote: params.gasNote,
    }),
  });
  const prepJson = await prepRes.json();
  if (!prepRes.ok) {
    throw new Error(prepJson.error || "Ghost Gas prepare failed");
  }

  const tx = Transaction.from(b64ToBytes(prepJson.transaction as string));
  const signed = await params.signTransaction(tx);
  const serialized = signed.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  const subRes = await fetch(`${RELAYER_URL}/v1/gas/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction: bytesToB64(serialized),
      gasNote: params.gasNote,
    }),
  });
  const subJson = await subRes.json();
  if (!subRes.ok) {
    throw new Error(subJson.error || "Ghost Gas submit failed");
  }

  const signature = String(subJson.signature);
  const creditRemaining = String(subJson.creditRemaining ?? "");
  return {
    signature,
    explorer: subJson.explorer || explorerTx(signature),
    creditRemaining,
  };
}

export function toRawAmount(uiAmount: string, decimals: number): string {
  const trimmed = uiAmount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid amount");
  }
  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > decimals) {
    throw new Error(`Max ${decimals} decimal places`);
  }
  const padded = frac.padEnd(decimals, "0");
  const raw = `${whole}${padded}`.replace(/^0+(?=\d)/, "");
  return raw === "" ? "0" : raw;
}

export { CLUSTER };
