/**
 * Prepaid Ghost Gas credits note (bearer instrument).
 * Format: ghost-gas:v1:<secretHex>:<commitmentHex>:<initialAmountRaw>
 *
 * commitment = sha256(secret bytes) as 32-byte hex.
 * Relayer stores remaining balance by commitment; presenting the note authorizes debit.
 */

function randomSecretHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]+$/.test(h) || h.length !== 64) {
    throw new Error("Invalid gas note secret/commitment hex");
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function commitmentFromGasSecret(secretHex: string): Promise<string> {
  return sha256Hex(hexToBytes(secretHex));
}

export type GasNote = {
  secret: string;
  commitment: string;
  /** Initial prepaid amount in USDC base units (string integer). */
  initialAmount: string;
  raw: string;
};

export async function createGasNote(initialAmountRaw: string): Promise<GasNote> {
  if (!/^\d+$/.test(initialAmountRaw) || initialAmountRaw === "0") {
    throw new Error("initialAmount must be a positive integer string");
  }
  const secret = randomSecretHex();
  const commitment = await commitmentFromGasSecret(secret);
  const raw = encodeGasNote(secret, commitment, initialAmountRaw);
  return { secret, commitment, initialAmount: initialAmountRaw, raw };
}

export function encodeGasNote(
  secretHex: string,
  commitmentHex: string,
  initialAmountRaw: string,
): string {
  return ["ghost-gas", "v1", secretHex, commitmentHex, initialAmountRaw].join(":");
}

export function decodeGasNote(raw: string): GasNote {
  const parts = raw.trim().split(":");
  if (parts.length !== 5 || parts[0] !== "ghost-gas" || parts[1] !== "v1") {
    throw new Error(
      "Invalid gas note — expected ghost-gas:v1:secret:commitment:amount",
    );
  }
  const secret = parts[2];
  const commitment = parts[3];
  const initialAmount = parts[4];
  if (!/^[0-9a-fA-F]{64}$/.test(secret) || !/^[0-9a-fA-F]{64}$/.test(commitment)) {
    throw new Error("Invalid gas note hex fields");
  }
  if (!/^\d+$/.test(initialAmount) || initialAmount === "0") {
    throw new Error("Invalid gas note amount");
  }
  return { secret, commitment, initialAmount, raw: raw.trim() };
}

export async function assertGasNoteIntegrity(note: GasNote): Promise<void> {
  const expected = await commitmentFromGasSecret(note.secret);
  if (expected !== note.commitment.toLowerCase() && expected !== note.commitment) {
    if (expected.toLowerCase() !== note.commitment.toLowerCase()) {
      throw new Error("Gas note commitment does not match secret");
    }
  }
}
