import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { assertSponsoredTransferTx } from "../src/gas.js";
import { resetRateLimits, takeRateLimit } from "../src/gas-rate-limit.js";

describe("Ghost Gas", () => {
  it("rate-limits per key", () => {
    resetRateLimits();
    assert.equal(takeRateLimit("a", 2).ok, true);
    assert.equal(takeRateLimit("a", 2).ok, true);
    const third = takeRateLimit("a", 2);
    assert.equal(third.ok, false);
  });

  it("rejects txs that are not fee-paid by the relayer", () => {
    const relayer = Keypair.generate();
    const stranger = Keypair.generate();
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: stranger.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: 1,
      }),
    );
    tx.feePayer = stranger.publicKey;
    tx.recentBlockhash = Keypair.generate().publicKey.toBase58().slice(0, 32).padEnd(32, "1");
    // recentBlockhash needs real base58 32-byte - use a valid one from a pubkey
    tx.recentBlockhash = Keypair.generate().publicKey.toBase58();

    assert.throws(
      () => assertSponsoredTransferTx(tx, relayer),
      /feePayer must be the Ghost relayer/,
    );
  });

  it("rejects non-token programs", () => {
    const relayer = Keypair.generate();
    const user = Keypair.generate();
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: user.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: 1,
      }),
    );
    tx.feePayer = relayer.publicKey;
    tx.recentBlockhash = PublicKey.default.toBase58();
    // SystemProgram transfer won't have a valid blockhash for serialize but we only assert structure
    // Need a blockhash-looking string — PublicKey.default is all 1s in base58? Actually default is 111..1
    tx.recentBlockhash = "11111111111111111111111111111111";

    assert.throws(() => assertSponsoredTransferTx(tx, relayer), /not allowlisted|Missing SPL/);
  });

  it("accepts a TransferChecked shaped tx signed by owner", () => {
    const relayer = Keypair.generate();
    const owner = Keypair.generate();
    const mint = Keypair.generate().publicKey;
    const source = Keypair.generate().publicKey;
    const dest = Keypair.generate().publicKey;

    const ix = createTransferCheckedInstruction(
      source,
      mint,
      dest,
      owner.publicKey,
      1_000_000n,
      6,
      [],
      TOKEN_PROGRAM_ID,
    );
    // Ensure ATA program isn't required
    assert.ok(ix.programId.equals(TOKEN_PROGRAM_ID));
    assert.ok(!ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID));

    const tx = new Transaction().add(ix);
    tx.feePayer = relayer.publicKey;
    tx.recentBlockhash = "11111111111111111111111111111111";
    tx.partialSign(owner);

    const out = assertSponsoredTransferTx(tx, relayer);
    assert.equal(out.from.toBase58(), owner.publicKey.toBase58());
    assert.equal(out.mint.toBase58(), mint.toBase58());
  });
});
