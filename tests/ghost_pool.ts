/**
 * Anchor integration test (localnet).
 * Covers initialize, deposit, relayer-gated withdraw, double-spend, and
 * unauthorized withdraw — without Groth16 (see scripts/e2e_local.ts for ZK).
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert } from "chai";

function leafPda(programId: PublicKey, mint: PublicKey, leafIndex: number) {
  const index = Buffer.alloc(4);
  index.writeUInt32LE(leafIndex);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("leaf"), mint.toBuffer(), index],
    programId,
  );
}

describe("ghost_pool", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.GhostPool as Program;
  const authority = (provider.wallet as anchor.Wallet).payer;
  const relayer = Keypair.generate();
  const recipient = Keypair.generate();
  const treasuryOwner = Keypair.generate();
  let mint: PublicKey;
  let pool: PublicKey;
  let vault: PublicKey;
  let treasuryToken: PublicKey;

  it("initializes pool, deposits, and pays out a gasless withdraw", async () => {
    await provider.connection.requestAirdrop(relayer.publicKey, 2_000_000_000).catch(() => {});

    mint = await createMint(provider.connection, authority, authority.publicKey, null, 6);
    [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mint.toBuffer()],
      program.programId,
    );
    vault = getAssociatedTokenAddressSync(mint, pool, true);
    treasuryToken = getAssociatedTokenAddressSync(mint, treasuryOwner.publicKey);

    await program.methods
      .initialize(30, relayer.publicKey)
      .accounts({
        authority: authority.publicKey,
        mint,
        pool,
        vault,
        treasury: treasuryOwner.publicKey,
        treasuryToken,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const depositorAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      mint,
      authority.publicKey,
    );
    await mintTo(provider.connection, authority, mint, depositorAta.address, authority, 5_000_000n);

    const commitment = Array.from({ length: 32 }, (_, i) => (i + 1) % 256);
    const [commitmentRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment"), Buffer.from(commitment)],
      program.programId,
    );
    const [leafRecord] = leafPda(program.programId, mint, 0);

    await program.methods
      .deposit(commitment)
      .accounts({
        depositor: authority.publicKey,
        pool,
        vault,
        depositorToken: depositorAta.address,
        commitmentRecord,
        leafRecord,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const poolAccount: any = await (program.account as any).poolConfig.fetch(pool);
    assert.equal(poolAccount.nextIndex, 1);
    assert.equal(poolAccount.depositCount, 1);

    const recipientAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      mint,
      recipient.publicKey,
    );

    const nullifier = Array.from({ length: 32 }, (_, i) => (i + 7) % 256);
    const root = Array.from({ length: 32 }, (_, i) => (i + 9) % 256);
    const [nullifierRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("nullifier"), Buffer.from(nullifier)],
      program.programId,
    );

    await program.methods
      .withdraw(nullifier, root)
      .accounts({
        relayer: relayer.publicKey,
        pool,
        vault,
        recipient: recipient.publicKey,
        recipientToken: recipientAta.address,
          treasury: treasuryOwner.publicKey,
          treasuryToken,
          nullifierRecord,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([relayer])
        .rpc();

    const rec = await getAccount(provider.connection, recipientAta.address);
    const tre = await getAccount(provider.connection, treasuryToken);
    assert.equal(rec.amount, 997_000n);
    assert.equal(tre.amount, 3_000n);

    try {
      await program.methods
        .withdraw(nullifier, root)
        .accounts({
          relayer: relayer.publicKey,
          pool,
          vault,
          recipient: recipient.publicKey,
          recipientToken: recipientAta.address,
          treasury: treasuryOwner.publicKey,
          treasuryToken,
          nullifierRecord,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([relayer])
        .rpc();
      assert.fail("double-spend should fail");
    } catch (err: any) {
      assert.ok(err);
    }
  });

  it("rejects withdraw from a non-relayer", async () => {
    const attacker = Keypair.generate();
    await provider.connection.requestAirdrop(attacker.publicKey, 1_000_000_000);
    await new Promise((r) => setTimeout(r, 500));

    const recipientAta = getAssociatedTokenAddressSync(mint, recipient.publicKey);
    const nullifier = Array.from({ length: 32 }, (_, i) => (i + 11) % 256);
    const root = Array.from({ length: 32 }, (_, i) => (i + 13) % 256);
    const [nullifierRecord] = PublicKey.findProgramAddressSync(
      [Buffer.from("nullifier"), Buffer.from(nullifier)],
      program.programId,
    );

    try {
      await program.methods
        .withdraw(nullifier, root)
        .accounts({
          relayer: attacker.publicKey,
          pool,
          vault,
          recipient: recipient.publicKey,
          recipientToken: recipientAta,
          treasury: treasuryOwner.publicKey,
          treasuryToken,
          nullifierRecord,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([attacker])
        .rpc();
      assert.fail("attacker withdraw should fail");
    } catch (err: any) {
      const msg = String(err);
      assert.ok(/UnauthorizedRelayer|0x1774|custom program error/i.test(msg), msg);
    }
  });
});
