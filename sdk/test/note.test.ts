import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCommitment,
  decodeNote,
  encodeNote,
  bigIntToBytes32,
  bytesToBigInt,
  DENOMINATION,
} from "../src/index.ts";

describe("Ghost notes", () => {
  it("round-trips encode/decode and Poseidon commitment", async () => {
    const { secret, nullifier, commitment } = await createCommitment();
    const raw = encodeNote(secret, nullifier, 3, commitment);
    const note = decodeNote(raw);
    assert.equal(note.secret, secret);
    assert.equal(note.nullifier, nullifier);
    assert.equal(note.commitment, commitment);
    assert.equal(note.leafIndex, 3);
    assert.equal(note.amount, DENOMINATION.toString());
    assert.match(raw, /^ghost:v1:/);
  });

  it("rejects malformed notes", () => {
    assert.throws(() => decodeNote("nope"), /Invalid Ghost Note/);
    assert.throws(() => decodeNote("ghost:v2:00:00:1:USDC:0:00"), /Invalid Ghost Note/);
  });

  it("big-endian bytes32 matches bigint", () => {
    const value = 0x010203n;
    const bytes = bigIntToBytes32(value);
    assert.equal(bytes.length, 32);
    assert.equal(bytes[31], 3);
    assert.equal(bytes[30], 2);
    assert.equal(bytes[29], 1);
    assert.equal(bytesToBigInt(Uint8Array.from(bytes)), value);
  });
});
