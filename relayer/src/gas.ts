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
  PublicKey,
  Transaction,
  TransactionInstruction,
  type Keypair,
} from "@solana/web3.js";
import { getConnection, loadRelayerKeypair } from "./solana.js";
import { loadConfig } from "./config.js";
import {
  assertGasNoteHasFee,
  creditGasNoteFee,
  debitGasNoteFee,
  effectiveDepositAllowlist,
  getGasTreasuryAta,
} from "./gas-credits.js";

const COMPUTE_BUDGET_PROGRAM_ID = ComputeBudgetProgram.programId;

/** Matches prepare(); anything higher is rejected on submit. */
export const GAS_CU_LIMIT = 200_000;
export const GAS_CU_PRICE = 1_000;

/** TransferChecked + optional 1 ATA + 2 budget ixs. */
const MAX_SPONSORED_IXS = 4;

// spl-token instruction tags
const TAG_TRANSFER = 3;
const TAG_TRANSFER_CHECKED = 12;
// associated-token-account: CreateIdempotent
const ATA_CREATE_IDEMPOTENT = 1;
// compute-budget
const CB_SET_LIMIT = 2;
const CB_SET_PRICE = 3;

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
  multiAsset: boolean;
  creditHaircutBps: number;
  creditDepositMints: string[];
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
    multiAsset: cfg.gasMultiAsset,
    creditHaircutBps: Number.isFinite(cfg.gasCreditHaircutBps)
      ? cfg.gasCreditHaircutBps
      : 200,
    creditDepositMints: effectiveDepositAllowlist(),
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
    throw Object.assign(new Error("amount must be a positive integer string"), {
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
  connection: ReturnType<typeof getConnection>,
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
 * Build an unsigned SPL TransferChecked tx. Fee payer = Ghost relayer.
 */
export async function prepareSponsoredTransfer(
  input: GasPrepareInput,
): Promise<{ transaction: string; feePayer: string; creditFeeRaw: string }> {
  const cfg = loadConfig();
  if (!cfg.gasEnabled) {
    throw Object.assign(new Error("Ghost Gas is disabled"), { statusCode: 503 });
  }
  if (!input.gasNote?.trim()) {
    throw Object.assign(new Error("gasNote required; top up credits with X1 first"), {
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
    ComputeBudgetProgram.setComputeUnitLimit({ units: GAS_CU_LIMIT }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: GAS_CU_PRICE }),
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

function readU32LE(data: Buffer, offset: number): number {
  return data.readUInt32LE(offset);
}

function readU64LE(data: Buffer, offset: number): bigint {
  return data.readBigUInt64LE(offset);
}

/**
 * Strict sponsored-tx policy:
 * - feePayer = relayer
 * - only ComputeBudget (capped), one CreateIdempotent ATA for transfer dest, one TransferChecked
 * - no Approve / SetAuthority / Transfer / etc.
 * - relayer must not appear in TransferChecked keys (not authority/source)
 */
export function assertSponsoredTransferTx(
  tx: Transaction,
  relayer: Keypair,
): { from: PublicKey; mint: PublicKey; destAta: PublicKey } {
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

  let transferIx: TransactionInstruction | null = null;
  let ataIx: TransactionInstruction | null = null;
  let sawLimit = false;
  let sawPrice = false;

  for (const ix of tx.instructions) {
    const prog = ix.programId.toBase58();

    if (prog === COMPUTE_BUDGET_PROGRAM_ID.toBase58()) {
      const tag = ix.data[0];
      if (tag === CB_SET_LIMIT) {
        if (ix.data.length < 5) {
          throw Object.assign(new Error("Malformed compute budget limit"), {
            statusCode: 400,
          });
        }
        const units = readU32LE(Buffer.from(ix.data), 1);
        if (units > GAS_CU_LIMIT) {
          throw Object.assign(
            new Error(`Compute unit limit ${units} exceeds max ${GAS_CU_LIMIT}`),
            { statusCode: 400 },
          );
        }
        sawLimit = true;
        continue;
      }
      if (tag === CB_SET_PRICE) {
        if (ix.data.length < 9) {
          throw Object.assign(new Error("Malformed compute budget price"), {
            statusCode: 400,
          });
        }
        const price = readU64LE(Buffer.from(ix.data), 1);
        if (price > BigInt(GAS_CU_PRICE)) {
          throw Object.assign(
            new Error(`Priority fee ${price} exceeds max ${GAS_CU_PRICE}`),
            { statusCode: 400 },
          );
        }
        sawPrice = true;
        continue;
      }
      throw Object.assign(new Error("Unsupported compute budget instruction"), {
        statusCode: 400,
      });
    }

    if (prog === ASSOCIATED_TOKEN_PROGRAM_ID.toBase58()) {
      if (ataIx) {
        throw Object.assign(new Error("Only one ATA creation allowed"), {
          statusCode: 400,
        });
      }
      // CreateIdempotent = 1; empty data also used by some create variants — require tag 1
      const tag = ix.data.length ? ix.data[0] : ATA_CREATE_IDEMPOTENT;
      if (tag !== ATA_CREATE_IDEMPOTENT) {
        throw Object.assign(new Error("Only idempotent ATA creation is allowed"), {
          statusCode: 400,
        });
      }
      const payer = ix.keys[0]?.pubkey;
      if (!payer || !payer.equals(relayer.publicKey)) {
        throw Object.assign(new Error("ATA creation must be paid by Ghost relayer"), {
          statusCode: 400,
        });
      }
      ataIx = ix;
      continue;
    }

    if (
      prog === TOKEN_PROGRAM_ID.toBase58() ||
      prog === TOKEN_2022_PROGRAM_ID.toBase58()
    ) {
      const tag = ix.data[0];
      if (tag === TAG_TRANSFER) {
        throw Object.assign(
          new Error("Plain Transfer is not allowed; use TransferChecked"),
          { statusCode: 400 },
        );
      }
      if (tag !== TAG_TRANSFER_CHECKED) {
        throw Object.assign(
          new Error(
            `Token instruction ${tag} is not allowed (TransferChecked only)`,
          ),
          { statusCode: 400 },
        );
      }
      if (transferIx) {
        throw Object.assign(new Error("Only one token transfer allowed per tx"), {
          statusCode: 400,
        });
      }
      transferIx = ix;
      continue;
    }

    throw Object.assign(new Error(`Program not allowlisted: ${prog}`), {
      statusCode: 400,
    });
  }

  if (!transferIx) {
    throw Object.assign(new Error("Missing SPL TransferChecked instruction"), {
      statusCode: 400,
    });
  }
  if (!sawLimit || !sawPrice) {
    throw Object.assign(
      new Error("Compute budget limit and price instructions are required"),
      { statusCode: 400 },
    );
  }

  // TransferChecked: [source, mint, dest, owner, ...]
  const source = transferIx.keys[0]?.pubkey;
  const mint = transferIx.keys[1]?.pubkey;
  const destAta = transferIx.keys[2]?.pubkey;
  const owner = transferIx.keys[3]?.pubkey;
  if (!source || !mint || !destAta || !owner) {
    throw Object.assign(new Error("Malformed TransferChecked instruction"), {
      statusCode: 400,
    });
  }

  // Relayer must not be token authority or source (prevents Approve-style abuse
  // and signing as treasury).
  for (const meta of transferIx.keys) {
    if (meta.pubkey.equals(relayer.publicKey)) {
      throw Object.assign(
        new Error("Relayer must not appear in TransferChecked accounts"),
        { statusCode: 400 },
      );
    }
  }

  const ownerSig = tx.signatures.find((s) => s.publicKey.equals(owner));
  if (!ownerSig?.signature) {
    throw Object.assign(new Error("Token owner signature missing"), { statusCode: 400 });
  }

  mintAllowed(mint);

  if (transferIx.data.length >= 9) {
    const amount = readU64LE(Buffer.from(transferIx.data), 1);
    if (amount <= 0n) {
      throw Object.assign(new Error("Transfer amount must be positive"), {
        statusCode: 400,
      });
    }
  }

  if (ataIx) {
    const createdAta = ataIx.keys[1]?.pubkey;
    const ataOwner = ataIx.keys[2]?.pubkey;
    const ataMint = ataIx.keys[3]?.pubkey;
    if (!createdAta || !ataOwner || !ataMint) {
      throw Object.assign(new Error("Malformed ATA instruction"), { statusCode: 400 });
    }
    if (!createdAta.equals(destAta)) {
      throw Object.assign(
        new Error("ATA creation must be for the transfer destination only"),
        { statusCode: 400 },
      );
    }
    if (!ataMint.equals(mint)) {
      throw Object.assign(new Error("ATA mint must match transfer mint"), {
        statusCode: 400,
      });
    }
    if (ataOwner.equals(relayer.publicKey)) {
      throw Object.assign(new Error("Cannot create ATA owned by the relayer"), {
        statusCode: 400,
      });
    }
  }

  return { from: owner, mint, destAta };
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

  const note = gasNoteRaw.trim();
  await assertGasNoteHasFee(note);

  let tx: Transaction;
  try {
    tx = Transaction.from(Buffer.from(transactionBase64, "base64"));
  } catch {
    throw Object.assign(new Error("Invalid transaction encoding"), { statusCode: 400 });
  }

  const relayer = loadRelayerKeypair();
  assertSponsoredTransferTx(tx, relayer);

  // Debit first (serialized) so concurrent submits cannot overspend.
  const afterDebit = await debitGasNoteFee(note);

  tx.partialSign(relayer);
  const connection = getConnection();
  try {
    const raw = tx.serialize();
    const signature = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    await connection.confirmTransaction(signature, "confirmed");
    return { signature, creditRemaining: afterDebit.remaining };
  } catch (err) {
    try {
      await creditGasNoteFee(note);
    } catch {
      /* best-effort refund */
    }
    throw err;
  }
}
