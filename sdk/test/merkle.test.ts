import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCommitment,
  buildMerkleTree,
  getMerklePath,
  reconstructRoot,
  TREE_DEPTH,
  poseidon2,
} from "../src/index.ts";

describe("Poseidon Merkle tree", () => {
  it("path reconstructs the root for a deposited leaf", async () => {
    const a = await createCommitment();
    const b = await createCommitment();
    const leaves = [
      { leafIndex: 0, commitment: a.commitment },
      { leafIndex: 1, commitment: b.commitment },
    ];
    const { root } = await buildMerkleTree(leaves);
    const path = await getMerklePath(leaves, 0);
    assert.equal(path.root, root);
    assert.equal(path.pathElements.length, TREE_DEPTH);
    assert.equal(path.pathIndices.length, TREE_DEPTH);
    const recomputed = await reconstructRoot(
      a.commitment,
      path.pathElements,
      path.pathIndices,
    );
    assert.equal(recomputed, root);
  });

  it("commitment is Poseidon(secret, nullifier)", async () => {
    const secret = 11n;
    const nullifier = 22n;
    const { commitment } = await createCommitment(secret, nullifier);
    assert.equal(commitment, await poseidon2(secret, nullifier));
  });
});
