import { PublicKey } from "@solana/web3.js";

/** Tree depth must match circuits/merkle_proof.circom */
export const TREE_DEPTH = 10;
export const MAX_LEAVES = 1 << TREE_DEPTH;

/** 1 USDC with 6 decimals — matches on-chain DENOMINATION */
export const DENOMINATION = 1_000_000n;

/** Empty leaf value for the off-chain Poseidon Merkle tree */
export const ZERO_LEAF = 0n;

/** Default pool fee (30 bps = 0.30%). */
export const DEFAULT_FEE_BPS = 30;
export const BPS_DENOMINATOR = 10_000n;

/** Stable program id from keys/ghost_pool-keypair.json */
export const PROGRAM_ID = "69gepJRrDXGgaKExaUHWmDjtLe4LHxTrNiGVzBGoTczR";

/** @deprecated use PROGRAM_ID */
export const PROGRAM_ID_DEVNET = PROGRAM_ID;

/**
 * Hosted Devnet relayer fee-payer. Secret stays on the host.
 * Pool `initialize` on Devnet should set this as `relayer`.
 */
export const HOSTED_RELAYER_DEVNET = "EWpDhR9kvBtPSwhiGbqarjxsy97nJSE784HjzkQ9Lsxf";

export const PROGRAM_PK = new PublicKey(PROGRAM_ID);
export const HOSTED_RELAYER_DEVNET_PK = new PublicKey(HOSTED_RELAYER_DEVNET);
