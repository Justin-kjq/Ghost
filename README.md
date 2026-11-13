# Ghost — Solana Lean MVP

Compliant-leaning **private USDC** transfers on **Solana Devnet**.

> Deposit 1 USDC → get a Ghost Note → withdraw later with a ZK proof.  
> Recipient needs **0 SOL**. Relayer pays fees and verifies Groth16 **off-chain**.

This is the Solana port of [Arnab-Afk/bnb](https://github.com/Arnab-Afk/bnb) (BNB Ghost Privacy Suite), stripped to a **Lean MVP**.

## What is live (target)

| Piece | Status |
|---|---|
| `ghost_pool` Anchor program | Source ready — deploy to Devnet |
| Circom Merkle circuit (depth 10) | Source ready — build artifacts |
| Fastify relayer (ZK verify + fee payer) | Ready |
| Next.js Deposit / Withdraw UI | Ready |
| Mainnet | Out of scope (use Devnet) |

## Architecture

```
Phantom wallet          Relayer (Fastify)           Solana Devnet
     |                        |                          |
     |-- deposit 1 USDC ------+------------------------->| ghost_pool
     |<- Ghost Note           |                          |
     |                        |                          |
     |-- note + recipient --->| verify Groth16           |
     |                        | build Merkle path        |
     |                        | sign as fee-payer ------>| withdraw
     |<- tx signature --------|                          |
```

### Trust model (documented)

- Deposit / commitment / nullifier state is on-chain.
- Merkle tree is mirrored **off-chain** by the relayer (from registered deposits).
- ZK proof is verified by the relayer with snarkjs — **not** on-chain.
- Only the designated **relayer pubkey** can call `withdraw`.

Good for Devnet demos / hackathons. Harden later with on-chain verification if needed.

## Repo layout

```
Ghost/
├── programs/ghost_pool/   # Anchor program
├── circuits/              # Circom + build scripts
├── sdk/                   # Notes, Poseidon, Merkle, proofs
├── relayer/               # Fastify fee-payer + ZK gate
├── frontend/              # Next.js DApp
├── scripts/               # Devnet mint + initialize helpers
└── tests/                 # Anchor smoke test
```

## Prerequisites

- Node 20+
- Rust + [Solana CLI](https://docs.solanalabs.com/cli/install)
- [Anchor 0.30.x](https://www.anchor-lang.com/docs/installation) (`avm install 0.30.1 && avm use 0.30.1`)
  - If `avm install` fails on a very new Rust toolchain, install a slightly older Rust (`rustup install 1.79 && rustup default 1.79`) and retry, or use the Anchor version that matches your toolchain.
- Circom 2.x (for circuit build)
- Phantom wallet (Devnet)

## Quick start (Devnet)

### 1. Install JS deps

```bash
npm install
```

### 2. Build & deploy program

```bash
anchor keys sync
anchor build
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet
```

Copy the program id into:

- `Anchor.toml`
- `programs/ghost_pool/src/lib.rs` (`declare_id!`)
- `frontend/.env.local` → `NEXT_PUBLIC_PROGRAM_ID`
- `relayer/.env` → `PROGRAM_ID`
- `target/idl/ghost_pool.json` → `address` (Anchor updates this on build)

### 3. Create mock USDC + initialize pool

```bash
npx tsx scripts/create_devnet_usdc.ts
# set USDC_MINT from output

RELAYER_PUBKEY=<relayer-pubkey> USDC_MINT=<mint> PROGRAM_ID=<program> \
  npx tsx scripts/initialize_pool.ts
```

### 4. Build ZK artifacts

```bash
# needs `circom` on PATH
npm run circuits:ptau
npm run circuits:build
```

This copies `wasm` / `zkey` / `verification_key.json` into `frontend/public/zk` and `relayer/zk`.

### 5. Run relayer + frontend

```bash
# relayer/.env
cp relayer/.env.example relayer/.env
# set RELAYER_SECRET_KEY, USDC_MINT, PROGRAM_ID

# frontend/.env.local
cp frontend/.env.local.example frontend/.env.local
# set NEXT_PUBLIC_USDC_MINT, NEXT_PUBLIC_PROGRAM_ID

npm run relayer
npm run frontend
```

Open http://localhost:3000

## User flow

1. **Deposit** — connect Phantom, deposit 1 USDC, **save the Ghost Note**.
2. **Withdraw** — paste note, pick recipient, generate proof (~seconds), relayer submits.
3. Same note cannot be spent twice (nullifier PDA).

## Fixed denomination

MVP uses a single amount: **1 USDC** (`1_000_000` base units, 6 decimals).

## Cost note

Devnet deploy / txs are free (airdrop).  
Mainnet is intentionally deferred until the binary is small and you have ~1–2 SOL.

## License

MIT
