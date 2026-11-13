import { DENOMINATION } from "./constants";
import { poseidon2 } from "./poseidon";

export interface GhostNote {
  secret: bigint;
  nullifier: bigint;
  amount: string;
  leafIndex: number;
  commitment: bigint;
  raw: string;
}

function randomField(): bigint {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt(hex);
}

export async function createCommitment(
  secret?: bigint,
  nullifier?: bigint,
): Promise<{ secret: bigint; nullifier: bigint; commitment: bigint }> {
  const s = secret ?? randomField();
  const n = nullifier ?? randomField();
  const commitment = await poseidon2(s, n);
  return { secret: s, nullifier: n, commitment };
}

export function encodeNote(
  secret: bigint,
  nullifier: bigint,
  leafIndex: number,
  commitment: bigint,
  amount: string = DENOMINATION.toString(),
): string {
  return [
    "ghost:v1",
    secret.toString(16).padStart(64, "0"),
    nullifier.toString(16).padStart(64, "0"),
    amount,
    "USDC",
    leafIndex.toString(),
    commitment.toString(16).padStart(64, "0"),
  ].join(":");
}

export function decodeNote(raw: string): GhostNote {
  const parts = raw.trim().split(":");
  if (parts.length !== 8 || parts[0] !== "ghost" || parts[1] !== "v1") {
    throw new Error(
      `Invalid Ghost Note — expected ghost:v1:secret:nullifier:amount:token:leafIndex:commitment`,
    );
  }
  return {
    secret: BigInt("0x" + parts[2]),
    nullifier: BigInt("0x" + parts[3]),
    amount: parts[4],
    leafIndex: Number(parts[6]),
    commitment: BigInt("0x" + parts[7]),
    raw,
  };
}

export function commitmentToBytes(commitment: bigint): Uint8Array {
  const hex = commitment.toString(16).padStart(64, "0");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToBigInt(bytes: Uint8Array): bigint {
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt(hex);
}

export function bigIntToBytes32(value: bigint): number[] {
  const hex = value.toString(16).padStart(64, "0");
  const out: number[] = [];
  for (let i = 0; i < 32; i++) {
    out.push(parseInt(hex.slice(i * 2, i * 2 + 2), 16));
  }
  return out;
}
