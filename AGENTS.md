# Ghost — agent context

## One-sentence pitch

**Ghost Gas:** X1 prepays USDC for gas credits (gas note). X2 signs token transfers with **0 SOL**; Ghost pays the fee and **debits the note** — without X1 ever sending SOL to X2.

## Mainnet

Gas-first: `.env.mainnet.example` + `npm run mainnet:preflight`. Circle USDC mint. `NEXT_PUBLIC_SHIELD_ENABLED=false` until pool is on-chain. Paid RPC required.

## Flow

```
X1 ── USDC top-up ──► Ghost treasury + gas note (ghost-gas:v1:…)
X2 + gas note ── sign SPL transfer ──► A1
                 Ghost feePayer pays SOL, debit note
```

## APIs / UI

| Piece | Path |
|---|---|
| Top up | `POST /v1/gas/credits/deposit`, UI `/app/credits` |
| Sponsor | `POST /v1/gas/prepare` + `/v1/gas/submit` (both need `gasNote`), UI `/app/send` |
| Shield (optional) | `/app/deposit`, `/app/withdraw`, `/app/notes` |

## Key files

- `sdk/src/gas-note.ts` — note encode/decode  
- `relayer/src/gas-credits.ts`, `relayer/src/gas.ts`  
- `frontend/lib/gas.ts`, `frontend/lib/gas-credits.ts`  
- Rules: `.cursor/rules/ghost-product.mdc`
