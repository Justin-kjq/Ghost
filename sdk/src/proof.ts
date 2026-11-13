import { poseidon1 } from "./poseidon";
import { pubkeyToRecipientField } from "./recipient";
import type { MerklePath } from "./merkle";
import type { GhostNote } from "./note";

export interface ProofInput {
  note: GhostNote;
  path: MerklePath;
  recipient: string;
}

export interface Groth16ProofPayload {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
  root: string;
  nullifierHash: string;
  recipientField: string;
}

/**
 * Generate a Groth16 proof in the browser / Node using snarkjs.
 * `wasmUrl` and `zkeyUrl` point at frontend/public/zk artifacts.
 */
export async function generateWithdrawProof(
  input: ProofInput,
  wasmUrl: string,
  zkeyUrl: string,
): Promise<Groth16ProofPayload> {
  const snarkjs = await import("snarkjs");
  const nullifierHash = await poseidon1(input.note.nullifier);
  const recipientField = pubkeyToRecipientField(input.recipient);

  const circuitInput = {
    secret: input.note.secret.toString(),
    nullifier: input.note.nullifier.toString(),
    pathElements: input.path.pathElements.map((x) => x.toString()),
    pathIndices: input.path.pathIndices.map((x) => x.toString()),
    root: input.path.root.toString(),
    nullifierHash: nullifierHash.toString(),
    recipient: recipientField.toString(),
  };

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    wasmUrl,
    zkeyUrl,
  );

  return {
    proof,
    publicSignals,
    root: publicSignals[0],
    nullifierHash: publicSignals[1],
    recipientField: publicSignals[2],
  };
}

export async function verifyWithdrawProof(
  payload: Pick<Groth16ProofPayload, "proof" | "publicSignals">,
  verificationKey: object,
): Promise<boolean> {
  const snarkjs = await import("snarkjs");
  return snarkjs.groth16.verify(verificationKey, payload.publicSignals, payload.proof);
}
