import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  type Keypair,
} from "@solana/web3.js";
import { getConnection, loadRelayerKeypair } from "./solana.js";
import { loadConfig } from "./config.js";
import {
  assertGasNoteHasFee,
  debitGasNoteFee,
  getGasTreasuryAta,
} from "./gas-credits.js";

/** Wallets often prepend SetComputeUnitLimit / SetComputeUnitPrice. */
const COMPUTE_BUDGET_PROGRAM_ID = ComputeBudgetProgram.programId;

const ALLOWED_PROGRAMS = new Set([
  TOKEN_PROGRAM_ID.toBase58(),
  TOKEN_2022_PROGRAM_ID.toBase58(),
  ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
  COMPUTE_BUDGET_PROGRAM_ID.toBase58(),
]);

/** budget(2) + ATA create(1) + transfer(1) + possible wallet budget dupes */
const MAX_SPONSORED_IXS = 6;

export type GasPrepareInput = {
  from: string;
  to: string;
  mint: string;
  /** Raw token amount (integer string, base units). */
  amount: string;
  /** Prepaid gas note that authorizes debiting X1's credit. */
  gasNote: string;
};

export type GasConfigPublic = {
  enabled: boolean;
  feePayer: string;
  maxPerHour: number;
  allowedMints: string[] | null;
  creditFeeRaw: string;
  usdcMint: string | null;
  treasury: string | null;
};

export function getGasPublicConfig(): GasConfigPublic {
  const cfg = loadConfig();
  const relayer = loadRelayerKeypair();
  let treasury: string | null = cfg.gasTreasury?.toBase58() ?? null;
  try {
    treasury = getGasTreasuryAta().toBase58();
  } catch {
    /* mint/keypair may be missing in unit tests */
  }
  return {
    enabled: cfg.gasEnabled,
    feePayer: relayer.publicKey.toBase58(),
    maxPerHour: cfg.gasMaxPerHour,
    allowedMints: cfg.gasAllowedMints,
    creditFeeRaw: cfg.gasCreditFeeRaw,
    usdcMint: cfg.usdcMint?.toBase58() ?? null,
    treasury,
  };
}

function assertPubkey(label: string, value: string): PublicKey {
  try {
    return new PublicKey(value);
  } catch {
    throw Object.assign(new Error(`Invalid ${label} address`), { statusCode: 400 });
  }
}

function parseAmount(raw: string): bigint {
  if (!/^\d+$/.test(raw) || raw === "0") {
    throw Object.assign(new Error("amount must be a positive integer string (base units)"), {
      statusCode: 400,
    });
  }
  return BigInt(raw);
}

function mintAllowed(mint: PublicKey): void {
  const allowed = loadConfig().gasAllowedMints;
  if (!allowed) return;
  if (!allowed.includes(mint.toBase58())) {
    throw Object.assign(new Error("Mint is not allowlisted for Ghost Gas"), {
      statusCode: 400,
    });
  }
}

async function resolveTokenProgram(
  connection: Connection,
  mint: PublicKey,
): Promise<PublicKey> {
  const info = await connection.getAccountInfo(mint);
  if (!info) {
    throw Object.assign(new Error("Mint account not found"), { statusCode: 400 });
  }
  const owner = info.owner.toBase58();
  if (owner === TOKEN_PROGRAM_ID.toBase58()) return TOKEN_PROGRAM_ID;
  if (owner === TOKEN_2022_PROGRAM_ID.toBase58()) return TOKEN_2022_PROGRAM_ID;
  throw Object.assign(new Error("Unsupported mint token program"), { statusCode: 400 });
}

/**
 * Build an unsigned (fee-payer unset signature) SPL transfer tx.
 * Fee payer = Ghost relayer. User must sign as `from`.
 */
export async function prepareSponsoredTransfer(
  input: GasPrepareInput,
): Promise<{ transaction: string; feePayer: string; creditFeeRaw: string }> {
  const cfg = loadConfig();
  if (!cfg.gasEnabled) {
    throw Object.assign(new Error("Ghost Gas is disabled"), { statusCode: 503 });
  }
  if (!input.gasNote?.trim()) {
    throw Object.assign(new Error("gasNote required — top up credits with X1 first"), {
      statusCode: 400,
    });
  }
  await assertGasNoteHasFee(input.gasNote.trim());

  const from = assertPubkey("from", input.from);
  const to = assertPubkey("to", input.to);
  const mint = assertPubkey("mint", input.mint);
  const amount = parseAmount(input.amount);
  mintAllowed(mint);

  if (from.equals(to)) {
    throw Object.assign(new Error("from and to must differ"), { statusCode: 400 });
  }

  const relayer = loadRelayerKeypair();
  const connection = getConnection();
  const tokenProgram = await resolveTokenProgram(connection, mint);
  const mintAccount = await getMint(connection, mint, "confirmed", tokenProgram);

  const fromAta = getAssociatedTokenAddressSync(
    mint,
    from,
    false,
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const toAta = getAssociatedTokenAddressSync(
    mint,
    to,
    false,
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  try {
    const source = await getAccount(connection, fromAta, "confirmed", tokenProgram);
    if (source.amount < amount) {
      throw Object.assign(new Error("Insufficient token balance"), { statusCode: 400 });
    }
  } catch (err: any) {
    if (err?.statusCode === 400) throw err;
    throw Object.assign(new Error("Sender has no token account for this mint"), {
      statusCode: 400,
    });
  }

  const ixs: TransactionInstruction[] = [
    // Include budget ixs ourselves so wallets are less likely to inject extras.
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }),
  ];
  const destInfo = await connection.getAccountInfo(toAta);
  if (!destInfo) {
    ixs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        relayer.publicKey,
        toAta,
        to,
        mint,
        tokenProgram,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  ixs.push(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      from,
      amount,
      mintAccount.decimals,
      [],
      tokenProgram,
    ),
  );

  const tx = new Transaction().add(...ixs);
  tx.feePayer = relayer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;

  const serialized = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  return {
    transaction: Buffer.from(serialized).toString("base64"),
    feePayer: relayer.publicKey.toBase58(),
    creditFeeRaw: cfg.gasCreditFeeRaw,
  };
}

function readU64LE(data: Buffer, offset: number): bigint {
  return data.readBigUInt64LE(offset);
}

/**
 * Ensure a user-signed tx is only an allowlisted sponsored SPL transfer
 * with Ghost as fee payer.
 */
export function assertSponsoredTransferTx(
  tx: Transaction,
  relayer: Keypair,
): { from: PublicKey; mint: PublicKey } {
  if (!tx.feePayer || !tx.feePayer.equals(relayer.publicKey)) {
    throw Object.assign(new Error("feePayer must be the Ghost relayer"), {
      statusCode: 400,
    });
  }

  if (!tx.instructions.length || tx.instructions.length > MAX_SPONSORED_IXS) {
    throw Object.assign(
      new Error(
        `Transaction has an unexpected instruction count (${tx.instructions.length}; max ${MAX_SPONSORED_IXS})`,
      ),
      { statusCode: 400 },
    );
  }

  for (const ix of tx.instructions) {
    if (!ALLOWED_PROGRAMS.has(ix.programId.toBase58())) {
      throw Object.assign(
        new Error(`Program not allowlisted: ${ix.programId.toBase58()}`),
        { statusCode: 400 },
      );
    }
  }

  // Transfer / TransferChecked discriminators (spl-token)
  // Transfer = 3, TransferChecked = 12
  let transferIx: TransactionInstruction | null = null;
  for (const ix of tx.instructions) {
    const prog = ix.programId.toBase58();
    if (prog !== TOKEN_PROGRAM_ID.toBase58() && prog !== TOKEN_2022_PROGRAM_ID.toBase58()) {
      continue;
    }
    const tag = ix.data[0];
    if (tag === 3 || tag === 12) {
      if (transferIx) {
        throw Object.assign(new Error("Only one token transfer allowed per tx"), {
          statusCode: 400,
        });
      }
      transferIx = ix;
    }
  }

  if (!transferIx) {
    throw Object.assign(new Error("Missing SPL token transfer instruction"), {
      statusCode: 400,
    });
  }

  // TransferChecked accounts: [source, mint, dest, owner, ...]
  // Transfer accounts: [source, dest, owner, ...]
  const tag = transferIx.data[0];
  const mint =
    tag === 12
      ? transferIx.keys[1]?.pubkey
      : null;
  const owner =
    tag === 12 ? transferIx.keys[3]?.pubkey : transferIx.keys[2]?.pubkey;

  if (!owner) {
    throw Object.assign(new Error("Malformed transfer instruction"), { statusCode: 400 });
  }

  // Owner must have signed (partial signature present)
  const ownerSig = tx.signatures.find((s) => s.publicKey.equals(owner));
  if (!ownerSig?.signature) {
    throw Object.assign(new Error("Token owner signature missing"), { statusCode: 400 });
  }

  if (mint) mintAllowed(mint);

  // Optional amount sanity for TransferChecked (u64 at offset 1)
  if (tag === 12 && transferIx.data.length >= 9) {
    const amount = readU64LE(Buffer.from(transferIx.data), 1);
    if (amount <= 0n) {
      throw Object.assign(new Error("Transfer amount must be positive"), { statusCode: 400 });
    }
  }

  // ATA creates must be paid by relayer
  for (const ix of tx.instructions) {
    if (!ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) continue;
    const payer = ix.keys[0]?.pubkey;
    if (!payer || !payer.equals(relayer.publicKey)) {
      throw Object.assign(new Error("ATA creation must be paid by Ghost relayer"), {
        statusCode: 400,
      });
    }
  }

  return { from: owner, mint: mint ?? PublicKey.default };
}

export async function submitSponsoredTransfer(
  transactionBase64: string,
  gasNoteRaw: string,
): Promise<{ signature: string; creditRemaining: string }> {
  const cfg = loadConfig();
  if (!cfg.gasEnabled) {
    throw Object.assign(new Error("Ghost Gas is disabled"), { statusCode: 503 });
  }
  if (!gasNoteRaw?.trim()) {
    throw Object.assign(new Error("gasNote required"), { statusCode: 400 });
  }

  await assertGasNoteHasFee(gasNoteRaw.trim());

  let tx: Transaction;
  try {
    tx = Transaction.from(Buffer.from(transactionBase64, "base64"));
  } catch {
    throw Object.assign(new Error("Invalid transaction encoding"), { statusCode: 400 });
  }

  const relayer = loadRelayerKeypair();
  assertSponsoredTransferTx(tx, relayer);

  tx.partialSign(relayer);

  const connection = getConnection();
  const raw = tx.serialize();
  const signature = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await connection.confirmTransaction(signature, "confirmed");

  const credit = await debitGasNoteFee(gasNoteRaw.trim());
  return { signature, creditRemaining: credit.remaining };
}
