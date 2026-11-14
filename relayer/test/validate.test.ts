import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Keypair } from "@solana/web3.js";
import { pubkeyToRecipientField } from "@ghost/sdk";
import { validateWithdrawInput } from "../src/validate.js";
import { configureStore, replaceDeposits, rebuildRoots } from "../src/store.js";

describe("validateWithdrawInput", () => {
  it("rejects missing fields", () => {
    assert.throws(() => validateWithdrawInput({}), /recipient, proof, publicSignals/);
  });

  it("rejects recipient mismatch and accepts a known root", async () => {
    configureStore("/tmp/ghost-relayer-test-validate");
    replaceDeposits([]);
    await rebuildRoots();
    const { getCurrentRoot } = await import("../src/store.js");
    const root = getCurrentRoot();
    const recipient = Keypair.generate().publicKey;
    const other = Keypair.generate().publicKey;
    const signals = [root, "12345", pubkeyToRecipientField(recipient).toString()];

    assert.throws(
      () =>
        validateWithdrawInput({
          recipient: other.toBase58(),
          proof: { pi_a: [], pi_b: [], pi_c: [], protocol: "groth16", curve: "bn128" },
          publicSignals: signals,
        }),
      /does not match recipient/,
    );

    const ok = validateWithdrawInput({
      recipient: recipient.toBase58(),
      proof: { pi_a: [], pi_b: [], pi_c: [], protocol: "groth16", curve: "bn128" },
      publicSignals: signals,
    });
    assert.equal(ok.recipient.toBase58(), recipient.toBase58());
  });
});
