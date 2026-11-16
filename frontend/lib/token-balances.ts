import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  MAINNET_USDC_MINT,
  RPC_URL,
  USDC_MINT_STR,
  isMainnetCluster,
} from "./config";
import { DEVNET } from "./addresses";
import { shortAddr } from "./ghost";

export const NATIVE_SOL_MINT = "native";

export type WalletToken = {
  mint: string;
  amountRaw: string;
  decimals: number;
  uiAmount: string;
  label: string;
  programId: string;
};

const GHOST_USDC =
  USDC_MINT_STR ||
  (isMainnetCluster() ? MAINNET_USDC_MINT : DEVNET.mint);

function labelForMint(mint: string): string {
  if (mint === GHOST_USDC || mint === MAINNET_USDC_MINT) return "USDC";
  return shortAddr(mint, 4);
}

async function loadProgramTokens(
  connection: Connection,
  owner: PublicKey,
  programId: PublicKey,
): Promise<WalletToken[]> {
  const res = await connection.getParsedTokenAccountsByOwner(owner, {
    programId,
  });
  const out: WalletToken[] = [];
  for (const { account } of res.value) {
    const info = account.data.parsed?.info;
    if (!info?.mint || !info?.tokenAmount) continue;
    const amountRaw = String(info.tokenAmount.amount || "0");
    if (amountRaw === "0") continue;
    const decimals = Number(info.tokenAmount.decimals ?? 0);
    const uiAmount =
      info.tokenAmount.uiAmountString ??
      (Number(amountRaw) / 10 ** decimals).toString();
    out.push({
      mint: info.mint as string,
      amountRaw,
      decimals,
      uiAmount,
      label: labelForMint(info.mint as string),
      programId: programId.toBase58(),
    });
  }
  return out;
}

/** SPL + Token-2022 balances with amount > 0. */
export async function fetchWalletTokens(owner: PublicKey): Promise<WalletToken[]> {
  const connection = new Connection(RPC_URL, "confirmed");
  const [classic, t22] = await Promise.all([
    loadProgramTokens(connection, owner, TOKEN_PROGRAM_ID),
    loadProgramTokens(connection, owner, TOKEN_2022_PROGRAM_ID),
  ]);
  const byMint = new Map<string, WalletToken>();
  for (const t of [...classic, ...t22]) byMint.set(t.mint, t);
  return [...byMint.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

/** SOL (first) + SPL balances for credit top-up. */
export async function fetchWalletAssets(owner: PublicKey): Promise<WalletToken[]> {
  const connection = new Connection(RPC_URL, "confirmed");
  const lamports = await connection.getBalance(owner);
  const sol: WalletToken = {
    mint: NATIVE_SOL_MINT,
    amountRaw: String(lamports),
    decimals: 9,
    uiAmount: (lamports / LAMPORTS_PER_SOL).toString(),
    label: "SOL",
    programId: "native",
  };
  const tokens = await fetchWalletTokens(owner);
  return [sol, ...tokens];
}

export function ataFor(mint: string, owner: PublicKey, programId?: string) {
  return getAssociatedTokenAddressSync(
    new PublicKey(mint),
    owner,
    false,
    programId ? new PublicKey(programId) : TOKEN_PROGRAM_ID,
  );
}
