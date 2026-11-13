import "dotenv/config";
import Fastify from "fastify";
import { PublicKey } from "@solana/web3.js";
import {
  decodeNote,
  getMerklePath,
  poseidon1,
  pubkeyToRecipientField,
  type Groth16ProofPayload,
} from "@ghost/sdk";
import { getDeposit, listDeposits, upsertDeposit } from "./store.js";
import { fetchPool, submitWithdraw } from "./solana.js";
import { verifyProof } from "./zk.js";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true, service: "ghost-relayer" }));

app.get("/v1/pool", async () => fetchPool());

app.get("/v1/deposits", async () => ({ deposits: listDeposits() }));

app.post<{
  Body: { leafIndex: number; commitment: string; txSignature?: string };
}>("/v1/deposits", async (req, reply) => {
  const { leafIndex, commitment, txSignature } = req.body ?? {};
  if (leafIndex === undefined || !commitment) {
    return reply.code(400).send({ error: "leafIndex and commitment required" });
  }
  const saved = upsertDeposit({
    leafIndex: Number(leafIndex),
    commitment: String(commitment),
    txSignature,
    createdAt: new Date().toISOString(),
  });
  return { deposit: saved };
});

app.get<{ Params: { leafIndex: string } }>(
  "/v1/merkle-path/:leafIndex",
  async (req, reply) => {
    const leafIndex = Number(req.params.leafIndex);
    const deposits = listDeposits();
    if (!getDeposit(leafIndex)) {
      return reply.code(404).send({ error: "Unknown leafIndex — register deposit first" });
    }
    const path = await getMerklePath(
      deposits.map((d) => ({
        leafIndex: d.leafIndex,
        commitment: BigInt(d.commitment.startsWith("0x") ? d.commitment : "0x" + d.commitment),
      })),
      leafIndex,
    );
    return {
      leafIndex,
      root: path.root.toString(),
      pathElements: path.pathElements.map((x) => x.toString()),
      pathIndices: path.pathIndices,
    };
  },
);

app.post<{
  Body: {
    note: string;
    recipient: string;
    proof: Groth16ProofPayload["proof"];
    publicSignals: string[];
  };
}>("/v1/withdraw", async (req, reply) => {
  try {
    const { note: noteRaw, recipient, proof, publicSignals } = req.body ?? {};
    if (!noteRaw || !recipient || !proof || !publicSignals) {
      return reply.code(400).send({ error: "note, recipient, proof, publicSignals required" });
    }

    const note = decodeNote(noteRaw);
    const recipientPk = new PublicKey(recipient);
    const expectedRecipient = pubkeyToRecipientField(recipientPk).toString();
    const expectedNullifierHash = (await poseidon1(note.nullifier)).toString();

    if (publicSignals[1] !== expectedNullifierHash) {
      return reply.code(400).send({ error: "publicSignals nullifierHash does not match note" });
    }
    if (publicSignals[2] !== expectedRecipient) {
      return reply.code(400).send({ error: "publicSignals recipient does not match recipient" });
    }

    const deposits = listDeposits();
    const path = await getMerklePath(
      deposits.map((d) => ({
        leafIndex: d.leafIndex,
        commitment: BigInt(d.commitment.startsWith("0x") ? d.commitment : "0x" + d.commitment),
      })),
      note.leafIndex,
    );
    if (publicSignals[0] !== path.root.toString()) {
      return reply.code(400).send({ error: "publicSignals root does not match relayer Merkle tree" });
    }

    const ok = await verifyProof({ proof, publicSignals });
    if (!ok) return reply.code(400).send({ error: "Invalid ZK proof" });

    const signature = await submitWithdraw({
      nullifier: BigInt(publicSignals[1]),
      root: BigInt(publicSignals[0]),
      recipient: recipientPk,
    });

    return {
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      amount: note.amount,
      recipient,
    };
  } catch (err: any) {
    req.log.error(err);
    return reply.code(500).send({ error: err?.message ?? "withdraw failed" });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`Ghost relayer listening on :${port}`);
});
