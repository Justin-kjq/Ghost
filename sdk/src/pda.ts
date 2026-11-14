import { PublicKey } from "@solana/web3.js";
import { PROGRAM_PK } from "./constants";

function program(id?: PublicKey | string): PublicKey {
  if (!id) return PROGRAM_PK;
  return typeof id === "string" ? new PublicKey(id) : id;
}

export function poolPda(
  mint: PublicKey,
  programId?: PublicKey | string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), mint.toBuffer()],
    program(programId),
  );
}

export function commitmentPda(
  commitment: Uint8Array | number[],
  programId?: PublicKey | string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("commitment"), Buffer.from(commitment)],
    program(programId),
  );
}

export function nullifierPda(
  nullifier: Uint8Array | number[],
  programId?: PublicKey | string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("nullifier"), Buffer.from(nullifier)],
    program(programId),
  );
}

/** Sequential leaf: seeds = ["leaf", mint, u32_le(index)] */
export function leafPda(
  mint: PublicKey,
  leafIndex: number,
  programId?: PublicKey | string,
): [PublicKey, number] {
  const index = Buffer.alloc(4);
  index.writeUInt32LE(leafIndex);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("leaf"), mint.toBuffer(), index],
    program(programId),
  );
}
