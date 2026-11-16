import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import {
  bigIntToBytes32,
  createCommitment,
  decodeNote,
  encodeNote,
  generateWithdrawProof,
} from "@ghost/sdk";
import { RELAYER_URL, getUsdcMint } from "./config";
import { commitmentPda, getProgram, leafPda, poolPda } from "./program";

export type WithdrawStep =
  | "path"
  | "prove"
  | "submit"
  | "done";

export async function depositUsdc(wallet: any): Promise<{
  signature: string;
  note: string;
  leafIndex: number;
  commitment: string;
}> {
  const mint = getUsdcMint();
  const program = getProgram(wallet);
  const [pool] = poolPda(mint);
  const poolAccount: any = await (program.account as any).poolConfig.fetch(pool);
  const leafIndex = poolAccount.nextIndex as number;

  const { secret, nullifier, commitment } = await createCommitment();
  const commitmentBytes = bigIntToBytes32(commitment);
  const [commitmentRecord] = commitmentPda(commitmentBytes);
  const [leafRecord] = leafPda(mint, leafIndex);

  const depositorToken = getAssociatedTokenAddressSync(mint, wallet.publicKey);

  const signature = await program.methods
    .deposit(commitmentBytes)
    .accounts({
      depositor: wallet.publicKey,
      pool,
      vault: poolAccount.vault,
      depositorToken,
      commitmentRecord,
      leafRecord,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  const note = encodeNote(secret, nullifier, leafIndex, commitment);

  await fetch(`${RELAYER_URL}/v1/deposits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leafIndex,
      commitment: "0x" + commitment.toString(16).padStart(64, "0"),
      txSignature: signature,
    }),
  }).catch(() => undefined);

  return {
    signature,
    note,
    leafIndex,
    commitment: commitment.toString(),
  };
}

export async function withdrawWithNote(
  noteRaw: string,
  recipient: string,
  onStep?: (step: WithdrawStep) => void,
): Promise<{ signature: string; explorer: string }> {
  const note = decodeNote(noteRaw);

  onStep?.("path");
  const pathRes = await fetch(`${RELAYER_URL}/v1/merkle-path/${note.leafIndex}`);
  if (!pathRes.ok) {
    const err = await pathRes.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch Merkle path");
  }
  const pathJson = await pathRes.json();
  const path = {
    pathElements: pathJson.pathElements.map((x: string) => BigInt(x)),
    pathIndices: pathJson.pathIndices as number[],
    root: BigInt(pathJson.root),
  };

  onStep?.("prove");
  const proofPayload = await generateWithdrawProof(
    { note, path, recipient },
    "/zk/merkle_proof.wasm",
    "/zk/merkle_proof_final.zkey",
  );

  onStep?.("submit");
  const withdrawRes = await fetch(`${RELAYER_URL}/v1/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient,
      proof: proofPayload.proof,
      publicSignals: proofPayload.publicSignals,
    }),
  });

  const body = await withdrawRes.json();
  if (!withdrawRes.ok) throw new Error(body.error || "Withdraw failed");
  onStep?.("done");
  return { signature: body.signature, explorer: body.explorer };
}

export async function fetchPoolInfo() {
  const res = await fetch(`${RELAYER_URL}/v1/pool`);
  if (!res.ok) throw new Error("Relayer /v1/pool failed. Is it running?");
  return res.json();
}

export async function fetchRelayerHealth() {
  const res = await fetch(`${RELAYER_URL}/health`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error("Relayer /health failed");
  return res.json() as Promise<{
    ok: boolean;
    service?: string;
    cluster?: string;
    deposits?: number;
    root?: string | null;
  }>;
}

export function shortAddr(value: string, size = 4) {
  if (value.length <= size * 2 + 2) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}
