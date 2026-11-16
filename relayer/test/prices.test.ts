import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyHaircut, isNativeMint, quoteInputMint, WSOL_MINT } from "../src/prices.js";

describe("gas credit pricing helpers", () => {
  it("recognizes native SOL aliases (not wrapped SOL mint)", () => {
    assert.equal(isNativeMint("native"), true);
    assert.equal(isNativeMint("SOL"), true);
    assert.equal(isNativeMint(WSOL_MINT), false);
    assert.equal(isNativeMint("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), false);
    assert.equal(quoteInputMint("native"), WSOL_MINT);
  });

  it("applies haircut in bps", () => {
    assert.equal(applyHaircut("1000000", 0), "1000000");
    assert.equal(applyHaircut("1000000", 200), "980000");
    assert.equal(applyHaircut("100", 200), "98");
  });
});
