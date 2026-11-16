import { Connection, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { RPC_URL, USDC_MINT_STR } from "./config";
import { DEVNET } from "./addresses";
import { shortAddr } from "./ghost";

export type WalletToken = {
  mint: string;
  amountRaw: string;
  decimals: number;
  uiAmount: string;
  label: string;
  programId: string;
};

const GHOST_USDC = USDC_MINT_STR || DEVNET.mint;

function labelForMint(mint: string): string {
  if (mint === GHOST_USDC) return "USDC (Ghost)";
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

export function ataFor(mint: string, owner: PublicKey, programId?: string) {
  return getAssociatedTokenAddressSync(
    new PublicKey(mint),
    owner,
    false,
    programId ? new PublicKey(programId) : TOKEN_PROGRAM_ID,
  );
}
