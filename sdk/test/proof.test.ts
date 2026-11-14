import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { Keypair } from "@solana/web3.js";
import {
  createCommitment,
  encodeNote,
  decodeNote,
  generateWithdrawProof,
  getMerklePath,
  poseidon1,
  pubkeyToRecipientField,
  verifyWithdrawProof,
} from "../src/index.ts";
import { readFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const wasm = join(root, "frontend", "public", "zk", "merkle_proof.wasm");
const zkey = join(root, "frontend", "public", "zk", "merkle_proof_final.zkey");
const vkPath = join(root, "relayer", "zk", "verification_key.json");

describe("Groth16 withdraw proof", () => {
  it("proves membership and binds the recipient", async (t) => {
    if (!existsSync(wasm) || !existsSync(zkey) || !existsSync(vkPath)) {
      t.skip("circuit artifacts not built");
      return;
    }
    const { secret, nullifier, commitment } = await createCommitment();
    const note = decodeNote(encodeNote(secret, nullifier, 0, commitment));
    const path = await getMerklePath([{ leafIndex: 0, commitment }], 0);
    const recipient = Keypair.generate().publicKey.toBase58();

    const payload = await generateWithdrawProof({ note, path, recipient }, wasm, zkey);
    assert.equal(payload.publicSignals.length, 3);
    assert.equal(payload.root, path.root.toString());
    assert.equal(payload.nullifierHash, (await poseidon1(nullifier)).toString());
    assert.equal(payload.recipientField, pubkeyToRecipientField(recipient).toString());

    const vk = JSON.parse(readFileSync(vkPath, "utf8"));
    assert.equal(await verifyWithdrawProof(payload, vk), true);

    const tampered = { ...payload, publicSignals: [...payload.publicSignals] };
    tampered.publicSignals[2] = pubkeyToRecipientField(Keypair.generate().publicKey).toString();
    assert.equal(await verifyWithdrawProof(tampered, vk), false);
  });
});
