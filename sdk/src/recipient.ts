import { PublicKey } from "@solana/web3.js";

/** BN254 scalar field modulus (same as circom / snarkjs). */
const SNARK_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/**
 * Bind a Solana pubkey into the circuit's `recipient` public signal.
 * Uses the 32-byte pubkey interpreted as a big-endian integer mod the field.
 */
export function pubkeyToRecipientField(pubkey: PublicKey | string): bigint {
  const key = typeof pubkey === "string" ? new PublicKey(pubkey) : pubkey;
  const bytes = key.toBytes();
  let value = 0n;
  for (const b of bytes) {
    value = (value << 8n) + BigInt(b);
  }
  return value % SNARK_FIELD;
}
