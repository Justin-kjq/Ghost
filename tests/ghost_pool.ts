/**
 * Anchor integration smoke test (localnet).
 * Run after: anchor localnet + anchor deploy
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
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert } from "chai";

describe("ghost_pool", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.GhostPool as Program;
  const authority = (provider.wallet as anchor.Wallet).payer;

  it("initializes pool and accepts a deposit", async () => {
    const mint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
    );
    const relayer = Keypair.generate();

    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mint.toBuffer()],
      program.programId,
    );
    const vault = getAssociatedTokenAddressSync(mint, pool, true);
    const treasuryToken = getAssociatedTokenAddressSync(mint, authority.publicKey);

    await program.methods
      .initialize(30, relayer.publicKey)
      .accounts({
        authority: authority.publicKey,
        mint,
        pool,
        vault,
        treasury: authority.publicKey,
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

    await program.methods
      .deposit(commitment)
      .accounts({
        depositor: authority.publicKey,
        pool,
        vault,
        depositorToken: depositorAta.address,
        commitmentRecord,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const poolAccount: any = await (program.account as any).poolConfig.fetch(pool);
    assert.equal(poolAccount.nextIndex, 1);
    assert.equal(poolAccount.depositCount, 1);
  });
});
