import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { createGasNote } from "@ghost/sdk";
import {
  CLUSTER,
  MAINNET_USDC_MINT,
  RELAYER_URL,
  RPC_URL,
  USDC_MINT_STR,
  isMainnetCluster,
} from "./config";
import { DEVNET } from "./addresses";
import { fetchGasConfig, toRawAmount } from "./gas";

/** Scope notes by cluster so mainnet never mixes with mock-USDC notes. */
const GAS_NOTES_KEY = `ghost.gasNotes.v1.${CLUSTER}`;

export type StoredGasNote = {
  note: string;
  commitment: string;
  initialAmount: string;
  depositTx?: string;
  createdAt: string;
  remaining?: string;
};

function readNotes(): StoredGasNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GAS_NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredGasNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotes(notes: StoredGasNote[]) {
  window.localStorage.setItem(GAS_NOTES_KEY, JSON.stringify(notes));
}

export function listGasNotes(): StoredGasNote[] {
  return readNotes();
}

export function saveGasNote(note: StoredGasNote) {
  writeNotes([note, ...readNotes().filter((n) => n.note !== note.note)]);
}

export function updateGasNoteRemaining(noteRaw: string, remaining: string) {
  writeNotes(
    readNotes().map((n) => (n.note === noteRaw ? { ...n, remaining } : n)),
  );
}

/**
 * X1 tops up prepaid gas: transfer USDC to Ghost treasury, register commitment, save gas note.
 */
export async function topUpGasCredits(params: {
  uiAmount: string;
  publicKey: PublicKey;
  signTransaction: <T extends Transaction>(tx: T) => Promise<T>;
}): Promise<StoredGasNote> {
  const gas = await fetchGasConfig();
  if (!gas.enabled) throw new Error("Ghost Gas is disabled");
  if (!gas.treasury) throw new Error("Relayer treasury not configured");
  if (!gas.usdcMint && !USDC_MINT_STR) throw new Error("USDC mint missing");

  const mintStr =
    gas.usdcMint ||
    USDC_MINT_STR ||
    (isMainnetCluster() ? MAINNET_USDC_MINT : DEVNET.mint);
  const connection = new Connection(RPC_URL, "confirmed");
  const mint = new PublicKey(mintStr);
  const treasury = new PublicKey(gas.treasury);
  const mintAccount = await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);
  const amountRaw = toRawAmount(params.uiAmount, mintAccount.decimals);
  if (amountRaw === "0") throw new Error("Amount must be greater than zero");

  const gasNote = await createGasNote(amountRaw);

  const fromAta = getAssociatedTokenAddressSync(mint, params.publicKey);
  const ixs = [];

  // Anyone can create the relayer's USDC ATA (X1 pays rent once). Owner = fee payer.
  const treasuryInfo = await connection.getAccountInfo(treasury);
  if (!treasuryInfo) {
    if (!gas.feePayer) {
      throw new Error("Relayer fee payer missing from gas config");
    }
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        params.publicKey,
        treasury,
        new PublicKey(gas.feePayer),
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  ixs.push(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      treasury,
      params.publicKey,
      BigInt(amountRaw),
      mintAccount.decimals,
    ),
  );

  const tx = new Transaction().add(...ixs);
  tx.feePayer = params.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const signed = await params.signTransaction(tx);
  const depositTx = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(depositTx, "confirmed");

  const reg = await fetch(`${RELAYER_URL}/v1/gas/credits/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commitment: gasNote.commitment,
      amount: amountRaw,
      txSignature: depositTx,
    }),
  });
  const regJson = await reg.json();
  if (!reg.ok) throw new Error(regJson.error || "Credit registration failed");

  const stored: StoredGasNote = {
    note: gasNote.raw,
    commitment: gasNote.commitment,
    initialAmount: amountRaw,
    depositTx,
    createdAt: new Date().toISOString(),
    remaining: amountRaw,
  };
  saveGasNote(stored);
  return stored;
}

export async function fetchGasNoteBalance(gasNote: string): Promise<{
  remaining: string;
  feePerTx: string;
}> {
  const res = await fetch(`${RELAYER_URL}/v1/gas/credits/balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gasNote }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Balance check failed");
  return { remaining: json.remaining, feePerTx: json.feePerTx };
}
