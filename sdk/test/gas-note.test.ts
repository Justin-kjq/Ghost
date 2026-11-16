import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertGasNoteIntegrity,
  commitmentFromGasSecret,
  createGasNote,
  decodeGasNote,
} from "../src/gas-note.js";

describe("gas notes", () => {
  it("round-trips and matches commitment", async () => {
    const note = await createGasNote("1000000");
    const decoded = decodeGasNote(note.raw);
    assert.equal(decoded.initialAmount, "1000000");
    await assertGasNoteIntegrity(decoded);
    assert.equal(await commitmentFromGasSecret(decoded.secret), decoded.commitment);
  });

  it("rejects garbage", () => {
    assert.throws(() => decodeGasNote("ghost:v1:nope"), /Invalid gas note/);
  });
});
