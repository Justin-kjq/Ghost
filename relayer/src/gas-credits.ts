import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  assertGasNoteIntegrity,
  decodeGasNote,
  type GasNote,
} from "@ghost/sdk";
import { loadConfig } from "./config.js";
import { getConnection, loadRelayerKeypair } from "./solana.js";

export type GasCredit = {
  commitment: string;
  initialAmount: string;
  remaining: string;
  depositTx: string;
  createdAt: string;
  updatedAt: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
let persistDir: string | null = null;
let credits: GasCredit[] = [];

export function configureGasCredits(dataDir?: string) {
  persistDir =
    dataDir && dataDir.length > 0 ? dataDir : join(__dirname, "..", "data");
  loadCredits();
}

function creditsFile(): string {
  return join(persistDir || join(__dirname, "..", "data"), "gas-credits.json");
}

function loadCredits() {
  const file = creditsFile();
  if (!existsSync(file)) {
    credits = [];
    return;
  }
  credits = JSON.parse(readFileSync(file, "utf8")) as GasCredit[];
}

function saveCredits() {
  const file = creditsFile();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(credits, null, 2));
}

function normCommitment(c: string): string {
  return (c.startsWith("0x") ? c.slice(2) : c).toLowerCase();
}

export function getGasTreasuryAta(): PublicKey {
  const cfg = loadConfig();
  const mint = cfg.usdcMint;
  if (!mint) throw new Error("USDC_MINT required for gas credits");
  if (cfg.gasTreasury) return cfg.gasTreasury;
  const relayer = loadRelayerKeypair();
  return getAssociatedTokenAddressSync(
    mint,
    relayer.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
}

export function getCredit(commitment: string): GasCredit | undefined {
  const key = normCommitment(commitment);
  return credits.find((c) => normCommitment(c.commitment) === key);
}

export function listCredits(): GasCredit[] {
  return [...credits];
}

/** Node sha256 of 32-byte secret — must match sdk WebCrypto commitment. */
export function commitmentFromSecretHex(secretHex: string): string {
  const h = secretHex.startsWith("0x") ? secretHex.slice(2) : secretHex;
  const bytes = Buffer.from(h, "hex");
  if (bytes.length !== 32) throw new Error("secret must be 32 bytes");
  return createHash("sha256").update(bytes).digest("hex");
}

async function verifyNote(raw: string): Promise<GasNote> {
  const note = decodeGasNote(raw);
  await assertGasNoteIntegrity(note);
  const expected = commitmentFromSecretHex(note.secret);
  if (expected !== normCommitment(note.commitment)) {
    throw Object.assign(new Error("Gas note failed integrity check"), {
      statusCode: 400,
    });
  }
  return note;
}

/**
 * Confirm an on-chain USDC transfer into the gas treasury, then open a credit
 * keyed by commitment.
 */
export async function registerGasCreditDeposit(params: {
  commitment: string;
  amount: string;
  txSignature: string;
}): Promise<GasCredit> {
  const cfg = loadConfig();
  if (!cfg.gasEnabled) {
    throw Object.assign(new Error("Ghost Gas is disabled"), { statusCode: 503 });
  }
  if (!cfg.usdcMint) {
    throw Object.assign(new Error("USDC_MINT required"), { statusCode: 500 });
  }
  if (!/^\d+$/.test(params.amount) || params.amount === "0") {
    throw Object.assign(new Error("amount must be a positive integer string"), {
      statusCode: 400,
    });
  }
  const commitment = normCommitment(params.commitment);
  if (!/^[0-9a-f]{64}$/.test(commitment)) {
    throw Object.assign(new Error("invalid commitment"), { statusCode: 400 });
  }
  if (getCredit(commitment)) {
    throw Object.assign(new Error("Commitment already registered"), {
      statusCode: 400,
    });
  }

  const treasury = getGasTreasuryAta();
  const connection = getConnection();
  const parsed = await connection.getParsedTransaction(params.txSignature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!parsed?.meta) {
    throw Object.assign(new Error("Deposit transaction not found"), {
      statusCode: 400,
    });
  }
  if (parsed.meta.err) {
    throw Object.assign(new Error("Deposit transaction failed on-chain"), {
      statusCode: 400,
    });
  }

  const mintStr = cfg.usdcMint.toBase58();
  const treasuryStr = treasury.toBase58();
  const relayerPk = loadRelayerKeypair().publicKey.toBase58();
  const want = BigInt(params.amount);
  let credited = 0n;

  const pre = parsed.meta.preTokenBalances || [];
  const post = parsed.meta.postTokenBalances || [];
  const accountKeys = parsed.transaction.message.accountKeys;

  for (const after of post) {
    if (after.mint !== mintStr) continue;
    const key = accountKeys[after.accountIndex];
    const tokenAccount =
      typeof key === "string"
        ? key
        : key && "pubkey" in key
          ? (key as { pubkey: PublicKey }).pubkey.toBase58()
          : null;
    const isTreasury =
      tokenAccount === treasuryStr || after.owner === relayerPk;
    if (!isTreasury) continue;

    const before = pre.find((b) => b.accountIndex === after.accountIndex);
    const afterAmt = BigInt(after.uiTokenAmount.amount);
    const beforeAmt = before ? BigInt(before.uiTokenAmount.amount) : 0n;
    const delta = afterAmt - beforeAmt;
    if (delta > 0n) credited += delta;
  }

  if (credited < want) {
    throw Object.assign(
      new Error(
        `On-chain treasury credit ${credited.toString()} is less than claimed ${want.toString()}`,
      ),
      { statusCode: 400 },
    );
  }

  const now = new Date().toISOString();
  const row: GasCredit = {
    commitment,
    initialAmount: params.amount,
    remaining: params.amount,
    depositTx: params.txSignature,
    createdAt: now,
    updatedAt: now,
  };
  credits.push(row);
  saveCredits();
  return row;
}

export async function peekGasNoteBalance(gasNoteRaw: string): Promise<{
  commitment: string;
  remaining: string;
  feePerTx: string;
}> {
  const note = await verifyNote(gasNoteRaw);
  const credit = getCredit(note.commitment);
  if (!credit) {
    throw Object.assign(new Error("Unknown gas note — top up credits first"), {
      statusCode: 400,
    });
  }
  return {
    commitment: credit.commitment,
    remaining: credit.remaining,
    feePerTx: loadConfig().gasCreditFeeRaw,
  };
}

/** Ensure note has enough remaining credit for one sponsored tx fee. */
export async function assertGasNoteHasFee(gasNoteRaw: string): Promise<GasNote> {
  const note = await verifyNote(gasNoteRaw);
  const credit = getCredit(note.commitment);
  if (!credit) {
    throw Object.assign(new Error("Unknown gas note — top up credits first"), {
      statusCode: 400,
    });
  }
  const fee = BigInt(loadConfig().gasCreditFeeRaw);
  if (BigInt(credit.remaining) < fee) {
    throw Object.assign(
      new Error(
        `Insufficient gas credit (need ${fee.toString()} base units, have ${credit.remaining})`,
      ),
      { statusCode: 402 },
    );
  }
  return note;
}

/** Debit flat fee after a successful sponsored send. */
export async function debitGasNoteFee(gasNoteRaw: string): Promise<GasCredit> {
  const note = await assertGasNoteHasFee(gasNoteRaw);
  const credit = getCredit(note.commitment)!;
  const fee = BigInt(loadConfig().gasCreditFeeRaw);
  const next = BigInt(credit.remaining) - fee;
  credit.remaining = next.toString();
  credit.updatedAt = new Date().toISOString();
  saveCredits();
  return credit;
}
