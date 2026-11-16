import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  configureGasCredits,
  getCreditByDepositTx,
  listCredits,
} from "../src/gas-credits.js";

describe("gas credit deposit uniqueness", () => {
  it("finds a credit by deposit tx signature", () => {
    const dir = mkdtempSync(join(tmpdir(), "ghost-gas-credits-"));
    writeFileSync(
      join(dir, "gas-credits.json"),
      JSON.stringify([
        {
          commitment: "aa".repeat(32),
          initialAmount: "1000000",
          remaining: "1000000",
          depositTx: "UsedDepositSig111",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    );
    configureGasCredits(dir);

    assert.equal(listCredits().length, 1);
    assert.ok(getCreditByDepositTx("UsedDepositSig111"));
    assert.equal(getCreditByDepositTx("UsedDepositSig111")?.commitment, "aa".repeat(32));
    assert.equal(getCreditByDepositTx("  UsedDepositSig111  ")?.depositTx, "UsedDepositSig111");
    assert.equal(getCreditByDepositTx("NeverSeenSig"), undefined);
  });
});
