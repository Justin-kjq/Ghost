pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/mux1.circom";

/*
 * GhostCommitment — Merkle inclusion proof for Ghost Privacy Pool (Solana Lean MVP)
 *
 * Private: secret, nullifier, pathElements[10], pathIndices[10]
 * Public:  root, nullifierHash, recipient
 *
 * Tree depth = 10 (1,024 deposits) — matches Lean MVP.
 */

template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component hashers[levels];
    component mux[levels];

    signal levelHashes[levels + 1];
    levelHashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        pathIndices[i] * (1 - pathIndices[i]) === 0;

        mux[i] = MultiMux1(2);
        mux[i].c[0][0] <== levelHashes[i];
        mux[i].c[0][1] <== pathElements[i];
        mux[i].c[1][0] <== pathElements[i];
        mux[i].c[1][1] <== levelHashes[i];
        mux[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== mux[i].out[0];
        hashers[i].inputs[1] <== mux[i].out[1];

        levelHashes[i + 1] <== hashers[i].out;
    }

    root <== levelHashes[levels];
}

template GhostCommitment(levels) {
    signal input secret;
    signal input nullifier;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal input root;
    signal input nullifierHash;
    signal input recipient;

    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash === nullifierHasher.out;

    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== nullifier;

    component tree = MerkleTreeChecker(levels);
    tree.leaf <== commitmentHasher.out;

    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    root === tree.root;

    signal recipientSquared;
    recipientSquared <== recipient * recipient;
}

component main { public [root, nullifierHash, recipient] } = GhostCommitment(10);
