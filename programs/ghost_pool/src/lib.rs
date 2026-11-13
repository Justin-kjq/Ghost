use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// Fixed denomination: 1 USDC (6 decimals).
pub const DENOMINATION: u64 = 1_000_000;
/// Default fee: 30 bps = 0.30%.
pub const DEFAULT_FEE_BPS: u16 = 30;
pub const BPS_DENOMINATOR: u64 = 10_000;

#[program]
pub mod ghost_pool {
    use super::*;

    /// Initialize the privacy pool for a single USDC mint.
    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16, relayer: Pubkey) -> Result<()> {
        require!(fee_bps <= 1_000, GhostError::FeeTooHigh);

        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.relayer = relayer;
        pool.mint = ctx.accounts.mint.key();
        pool.vault = ctx.accounts.vault.key();
        pool.treasury = ctx.accounts.treasury.key();
        pool.denomination = DENOMINATION;
        pool.fee_bps = fee_bps;
        pool.next_index = 0;
        pool.deposit_count = 0;
        pool.bump = ctx.bumps.pool;

        emit!(PoolInitialized {
            authority: pool.authority,
            relayer: pool.relayer,
            mint: pool.mint,
            denomination: pool.denomination,
            fee_bps: pool.fee_bps,
        });

        Ok(())
    }

    /// Deposit exactly `denomination` USDC and insert a Poseidon commitment.
    /// Merkle tree updates happen off-chain from the Deposit event.
    pub fn deposit(ctx: Context<Deposit>, commitment: [u8; 32]) -> Result<()> {
        require!(commitment != [0u8; 32], GhostError::InvalidCommitment);

        let pool = &mut ctx.accounts.pool;
        let leaf_index = pool.next_index;

        let cpi_accounts = Transfer {
            from: ctx.accounts.depositor_token.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            pool.denomination,
        )?;

        let record = &mut ctx.accounts.commitment_record;
        record.commitment = commitment;
        record.leaf_index = leaf_index;
        record.bump = ctx.bumps.commitment_record;

        pool.next_index = leaf_index
            .checked_add(1)
            .ok_or(GhostError::TreeFull)?;
        pool.deposit_count = pool
            .deposit_count
            .checked_add(1)
            .ok_or(GhostError::TreeFull)?;

        emit!(DepositEvent {
            commitment,
            leaf_index,
            amount: pool.denomination,
            depositor: ctx.accounts.depositor.key(),
        });

        Ok(())
    }

    /// Withdraw denomination to `recipient` after off-chain ZK verification.
    /// Only the designated relayer may call this (Lean MVP trust model).
    pub fn withdraw(
        ctx: Context<Withdraw>,
        nullifier: [u8; 32],
        root: [u8; 32],
    ) -> Result<()> {
        require!(nullifier != [0u8; 32], GhostError::InvalidNullifier);
        require!(root != [0u8; 32], GhostError::InvalidRoot);

        let pool = &ctx.accounts.pool;
        require_keys_eq!(
            ctx.accounts.relayer.key(),
            pool.relayer,
            GhostError::UnauthorizedRelayer
        );

        let fee = (pool.denomination as u128)
            .checked_mul(pool.fee_bps as u128)
            .ok_or(GhostError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u128)
            .ok_or(GhostError::MathOverflow)? as u64;
        let payout = pool
            .denomination
            .checked_sub(fee)
            .ok_or(GhostError::MathOverflow)?;

        let nullifier_record = &mut ctx.accounts.nullifier_record;
        nullifier_record.nullifier = nullifier;
        nullifier_record.root = root;
        nullifier_record.recipient = ctx.accounts.recipient.key();
        nullifier_record.bump = ctx.bumps.nullifier_record;

        let seeds: &[&[u8]] = &[b"pool", pool.mint.as_ref(), &[pool.bump]];
        let signer = &[seeds];

        if payout > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.recipient_token.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer,
                ),
                payout,
            )?;
        }

        if fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.treasury_token.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    cpi_accounts,
                    signer,
                ),
                fee,
            )?;
        }

        emit!(WithdrawEvent {
            nullifier,
            root,
            recipient: ctx.accounts.recipient.key(),
            amount: payout,
            fee,
        });

        Ok(())
    }

    /// Rotate the fee-payer / ZK gatekeeper key.
    pub fn set_relayer(ctx: Context<SetRelayer>, new_relayer: Pubkey) -> Result<()> {
        ctx.accounts.pool.relayer = new_relayer;
        emit!(RelayerUpdated { relayer: new_relayer });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + PoolConfig::INIT_SPACE,
        seeds = [b"pool", mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, PoolConfig>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = pool
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: treasury owner wallet that receives fee ATAs
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = treasury
    )]
    pub treasury_token: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(commitment: [u8; 32])]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, PoolConfig>,

    #[account(
        mut,
        address = pool.vault,
        constraint = vault.mint == pool.mint @ GhostError::MintMismatch
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = depositor_token.owner == depositor.key() @ GhostError::OwnerMismatch,
        constraint = depositor_token.mint == pool.mint @ GhostError::MintMismatch
    )]
    pub depositor_token: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = depositor,
        space = 8 + CommitmentRecord::INIT_SPACE,
        seeds = [b"commitment", commitment.as_ref()],
        bump
    )]
    pub commitment_record: Account<'info, CommitmentRecord>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(nullifier: [u8; 32])]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub relayer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.mint.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, PoolConfig>,

    #[account(
        mut,
        address = pool.vault,
        constraint = vault.mint == pool.mint @ GhostError::MintMismatch
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: arbitrary withdraw destination
    pub recipient: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = recipient_token.owner == recipient.key() @ GhostError::OwnerMismatch,
        constraint = recipient_token.mint == pool.mint @ GhostError::MintMismatch
    )]
    pub recipient_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        address = pool.treasury
    )]
    /// CHECK: treasury wallet stored on pool
    pub treasury: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = treasury_token.owner == treasury.key() @ GhostError::OwnerMismatch,
        constraint = treasury_token.mint == pool.mint @ GhostError::MintMismatch
    )]
    pub treasury_token: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = relayer,
        space = 8 + NullifierRecord::INIT_SPACE,
        seeds = [b"nullifier", nullifier.as_ref()],
        bump
    )]
    pub nullifier_record: Account<'info, NullifierRecord>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetRelayer<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.mint.as_ref()],
        bump = pool.bump,
        has_one = authority @ GhostError::UnauthorizedAuthority
    )]
    pub pool: Account<'info, PoolConfig>,
}

#[account]
#[derive(InitSpace)]
pub struct PoolConfig {
    pub authority: Pubkey,
    pub relayer: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub treasury: Pubkey,
    pub denomination: u64,
    pub fee_bps: u16,
    pub next_index: u32,
    pub deposit_count: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CommitmentRecord {
    pub commitment: [u8; 32],
    pub leaf_index: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct NullifierRecord {
    pub nullifier: [u8; 32],
    pub root: [u8; 32],
    pub recipient: Pubkey,
    pub bump: u8,
}

#[event]
pub struct PoolInitialized {
    pub authority: Pubkey,
    pub relayer: Pubkey,
    pub mint: Pubkey,
    pub denomination: u64,
    pub fee_bps: u16,
}

#[event]
pub struct DepositEvent {
    pub commitment: [u8; 32],
    pub leaf_index: u32,
    pub amount: u64,
    pub depositor: Pubkey,
}

#[event]
pub struct WithdrawEvent {
    pub nullifier: [u8; 32],
    pub root: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct RelayerUpdated {
    pub relayer: Pubkey,
}

#[error_code]
pub enum GhostError {
    #[msg("Fee bps must be <= 1000 (10%)")]
    FeeTooHigh,
    #[msg("Commitment cannot be zero")]
    InvalidCommitment,
    #[msg("Nullifier cannot be zero")]
    InvalidNullifier,
    #[msg("Root cannot be zero")]
    InvalidRoot,
    #[msg("Only the designated relayer may call withdraw")]
    UnauthorizedRelayer,
    #[msg("Only the pool authority may update settings")]
    UnauthorizedAuthority,
    #[msg("Token mint mismatch")]
    MintMismatch,
    #[msg("Token account owner mismatch")]
    OwnerMismatch,
    #[msg("Merkle / deposit index overflow")]
    TreeFull,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}
