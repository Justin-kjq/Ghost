# Ghost — Solana Lean MVP

Compliant-leaning **private USDC** transfers on **Solana** (localnet / Devnet / testnet).

> **Ghost Gas:** X1 tops up USDC → gas note; X2 signs transfers with 0 SOL; Ghost pays fees and debits the note.  
> **Ghost Shield (optional):** Deposit 1 USDC → Ghost Note → ZK withdraw to a fresh address.

This is the Solana port of [Arnab-Afk/bnb](https://github.com/Arnab-Afk/bnb) (BNB Ghost Privacy Suite), stripped to a **Lean MVP**.

**Program id** (all clusters): `69gepJRrDXGgaKExaUHWmDjtLe4LHxTrNiGVzBGoTczR`  
**Hosted Devnet relayer fee-payer** (secret on the host): `EWpDhR9kvBtPSwhiGbqarjxsy97nJSE784HjzkQ9Lsxf`  
**Production UI / API:** `https://ghost.arnabbhowmik.in` / `https://ghost-api.arnabbhowmik.in`

## Trust model (honest)

This Lean MVP is **not** a trustless mixer.

| What | Who enforces it |
|---|---|
| Deposit of exactly 1 USDC + unique commitment | On-chain (`ghost_pool`) |
| Nullifier double-spend (same note twice) | On-chain nullifier PDA |
| Merkle tree / inclusion proof | **Off-chain relayer** (Poseidon tree, rebuilt from on-chain `LeafRecord`s) |
| Groth16 proof + recipient binding | **Off-chain relayer** (`snarkjs`) |
| Who can call `withdraw` | On-chain: only `pool.relayer` |

A **malicious relayer can drain the vault**. It can call `withdraw` with any unused nullifier and any root; the program does not verify the proof. Use this for Devnet / hackathon demos. On-chain Groth16 + Merkle history is the hardening path.

The relayer **does not need the Ghost Note**. Proofs are generated in the browser/SDK. Sending the note to the relayer would let it link deposit → withdraw.

`ALLOW_MOCK_PROOF=1` is ignored unless `RPC_URL` is localhost.

## Repo layout

```
Ghost/
├── programs/ghost_pool/   # Anchor program
├── circuits/              # Circom + build scripts
├── sdk/                   # Notes, Poseidon, Merkle, proofs
├── relayer/               # Fastify fee-payer + ZK gate
├── frontend/              # Next.js DApp (output: standalone)
├── scripts/               # Mint, initialize, e2e, fund relayer
├── tests/                 # Anchor localnet tests
├── keys/                  # Program address keypair (not a funded wallet)
├── docker-compose.yml
└── deployments.json
```

## Prerequisites

- Node 20+
- Rust 1.79 (`rustup install 1.79.0 && rustup default 1.79.0`)
- [Solana CLI 1.18.x](https://docs.anza.xyz/cli/install) (`solana-test-validator`, `cargo-build-sbf`)
- Anchor 0.30.1 (`npx anchor` via `@coral-xyz/anchor-cli`, or `avm install 0.30.1`)
- Circom 2.x on `PATH` (circuit build only)

## Localnet (recommended first run)

```bash
npm install
solana-keygen new --outfile ~/.config/solana/id.json   # throwaway, never commit
solana config set --url localhost

# ZK artifacts (once)
npm run circuits:ptau
npm run circuits:build

# Program (Solana 1.18 CLI + platform-tools v1.52 / Rust 1.89 for edition2024 crates)
npm run build:program
# equivalent: bash scripts/build_program.sh

# Full on-chain + Groth16 + relayer withdraw (starts solana-test-validator if needed)
npm run test:e2e

# Unit tests
npm test

# Anchor smoke (initialize / deposit / withdraw / double-spend)
npm run test:anchor
```

## Devnet (live)

Program, mock USDC, and pool are on **Solana Devnet**. `pool.relayer` is the hosted fee-payer `EWpDhR9kvBtPSwhiGbqarjxsy97nJSE784HjzkQ9Lsxf`.

| | |
|---|---|
| Program | [`69gepJRrDXGgaKExaUHWmDjtLe4LHxTrNiGVzBGoTczR`](https://explorer.solana.com/address/69gepJRrDXGgaKExaUHWmDjtLe4LHxTrNiGVzBGoTczR?cluster=devnet) |
| Mock USDC | [`GLfrBSjkzFQZJrWEcWfA9j1yapabGYTwdcNJKAgqWeCt`](https://explorer.solana.com/address/GLfrBSjkzFQZJrWEcWfA9j1yapabGYTwdcNJKAgqWeCt?cluster=devnet) |
| Pool | [`DbMcqri6ScZSnQBpDATapaWWUfUGTiytyMuzZrZKpZCr`](https://explorer.solana.com/address/DbMcqri6ScZSnQBpDATapaWWUfUGTiytyMuzZrZKpZCr?cluster=devnet) |
| Deploy | [`2SeaHtd…31HX`](https://explorer.solana.com/tx/2SeaHtdSivBHkkZGcdw3hi6DbCCTygmHGzkqrL4CkBaGvBg2q15Fa3DssoSSWhVUyavM26kSUdbKAuyNMYxX31HX?cluster=devnet) |
| Deposit | [`9YbP8qm…w2Dz`](https://explorer.solana.com/tx/9YbP8qmVaZErFVo3QZpL88bEgYFf5BXosUHjUzGZbuUWzSAofvNLvoUDeUoYqbiFUd6omkAu9c17tB4bTRZw2Dz?cluster=devnet) |
| Gasless withdraw | [`5TyWpPb…HFsU`](https://explorer.solana.com/tx/5TyWpPbxk9PED7NnCECALQ416YzryUfNrtNoZ7PcMRuPxbDWHcdHWi83AH5jH6DoMA1Pg2PtDAmJpF6QNxkZHFsU?cluster=devnet) |

`KEEP_LOCAL_RELAYER=1 AUTHORITY_KEYPAIR_PATH=… npm run test:e2e:devnet` redeploys/mints as needed. After a local demo key is used for withdraws, restore the host key with `npm run set:relayer`.

**Testnet:** `solana airdrop` failed (faucet closed / rate limited). Not deployed.

## Devnet / testnet (from scratch)

**Mainnet (Gas-first):** copy `.env.mainnet.example` → host `.env`, fund a dedicated relayer with real SOL, use a paid RPC + Circle USDC `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`, run `npm run mainnet:preflight`, then rebuild compose. Shield stays off until the pool is deployed. Relayer is trusted for gas debit — treat the key like production custody.

Devnet / local: use a throwaway keypair with **test SOL only**.

```bash
solana config set --url devnet
npm run build:program
anchor deploy --provider.cluster devnet

RPC_URL=https://api.devnet.solana.com npx tsx scripts/create_devnet_usdc.ts
# set USDC_MINT from output

SOLANA_CLUSTER=devnet RELAYER_PUBKEY=EWpDhR9kvBtPSwhiGbqarjxsy97nJSE784HjzkQ9Lsxf \
  USDC_MINT=<mint> RPC_URL=https://api.devnet.solana.com \
  npx tsx scripts/initialize_pool.ts
```

Copy the mint into `frontend/.env.local` and the relayer env.

## Relayer + UI (local)

```bash
cp relayer/.env.example relayer/.env
# RELAYER_KEYPAIR_PATH=/absolute/path/to/64-byte-json-array.json
# USDC_MINT, PROGRAM_ID, RPC_URL, ALLOWED_ORIGINS

cp frontend/.env.local.example frontend/.env.local
# NEXT_PUBLIC_USDC_MINT, NEXT_PUBLIC_PROGRAM_ID, NEXT_PUBLIC_RPC_URL

npm run relayer    # :3001  GET /health
npm run frontend   # :3000
```

Connect any Solana wallet via **Reown AppKit / WalletConnect** (Phantom, Solflare,
QR wallets, and more). Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` from
[dashboard.reown.com](https://dashboard.reown.com) (the built-in demo id only
works on localhost). For headless demos only: `NEXT_PUBLIC_ENABLE_DEV_WALLET=true`
plus `window.__GHOST_DEV_WALLET__` = a 64-byte JSON array injected at runtime.
Never put a secret in `NEXT_PUBLIC_*`.

## Hosting (Docker)

Frontend: `https://ghost.arnabbhowmik.in`  
Relayer: `https://ghost-api.arnabbhowmik.in`

```bash
cp .env.example .env
# set USDC_MINT, NEXT_PUBLIC_USDC_MINT, RELAYER_KEYPAIR_PATH (host file)

docker compose build
docker compose up -d
```

| Service | Listen | Health | State |
|---|---|---|---|
| Relayer | `HOST`+`PORT` (default **0.0.0.0:3001**) | **GET /health** | No DB. Optional `DATA_DIR` file cache. Merkle tree **rebuilt from on-chain `LeafRecord` PDAs on startup** and before path/withdraw. Root history is in-memory (recomputed on sync). |
| Frontend | `PORT` (default **3000**), `output: 'standalone'` | Next.js | Stateless. `NEXT_PUBLIC_*` are **build-time**. |

**CORS:** `ALLOWED_ORIGINS` (comma-separated). Default:
`https://ghost.arnabbhowmik.in,http://localhost:3000,http://127.0.0.1:3000`.

**Relayer key:** `RELAYER_KEYPAIR_PATH` → standard Solana **64-byte JSON array** (`solana-keygen` format). The image does not contain a key. Optional fallback: `RELAYER_SECRET_KEY`.

**Frontend build-time env:** `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_CLUSTER`, `NEXT_PUBLIC_RELAYER_URL`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_USDC_MINT`, `NEXT_PUBLIC_ENABLE_DEV_WALLET`.

**Frontend runtime env:** `PORT`, `HOST`.

**Relayer runtime env:** `PORT`, `HOST`, `ALLOWED_ORIGINS`, `RPC_URL`, `SOLANA_CLUSTER`, `PROGRAM_ID`, `USDC_MINT`, `RELAYER_KEYPAIR_PATH`, `RELAYER_SECRET_KEY`, `DATA_DIR`, `ROOT_HISTORY_SIZE`, `ALLOW_MOCK_PROOF`.

See `.env.example` for the full list.

## User flow

1. **Deposit** — connect wallet, deposit 1 USDC, **save the Ghost Note** (it is the secret).
2. **Withdraw** — paste note, pick recipient, generate proof in the browser, relayer submits.
3. Same note cannot be spent twice (nullifier PDA).

## Fixed denomination

MVP uses a single amount: **1 USDC** (`1_000_000` base units, 6 decimals). Default fee 30 bps (recipient gets 0.997 USDC).

## Circuit

Depth-10 Poseidon Merkle tree (1,024 leaves). Public signals: `root`, `nullifierHash`, `recipient`.
`ptau` / `.zkey` / `.wasm` are generated locally and gitignored (large). `verification_key.json` is public and committed for the relayer.

## License

MIT
