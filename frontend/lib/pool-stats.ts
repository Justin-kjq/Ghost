import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { poolPda } from "@ghost/sdk";
import { CLUSTER, PROGRAM_ID, RELAYER_URL, RPC_URL, USDC_MINT_STR } from "./config";
import { DEVNET } from "./addresses";

export type PoolLiveStats = {
  deposits: number | null;
  tvlUi: string | null;
  anonymitySet: number | null;
  lastActivityIso: string | null;
  relayerOk: boolean | null;
  cluster: string;
  pool: string | null;
  vault: string | null;
  mint: string | null;
  tvlSource: "vault" | "unavailable";
};

export type PoolActivityRow = {
  kind: "deposit" | "pool";
  signature: string;
  at: string | null;
  detail?: string;
};

const TIMEOUT_MS = 4000;

async function timed<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await Promise.race([
      p,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
  } catch {
    return null;
  }
}

function connection() {
  return new Connection(RPC_URL, "confirmed");
}

function mintKey(): PublicKey | null {
  const raw = USDC_MINT_STR || (CLUSTER === "devnet" ? DEVNET.mint : "");
  if (!raw) return null;
  try {
    return new PublicKey(raw);
  } catch {
    return null;
  }
}

function deriveVault(mint: PublicKey): { pool: PublicKey; vault: PublicKey } {
  const [pool] = poolPda(mint, PROGRAM_ID);
  const vault = getAssociatedTokenAddressSync(mint, pool, true);
  return { pool, vault };
}

type RelayerPool = {
  address?: string;
  vault?: string;
  mint?: string;
  depositCount?: number;
  vaultBalanceUi?: string | null;
  vaultAmount?: string | null;
};

async function relayerPool(): Promise<RelayerPool | null> {
  const res = await timed(
    fetch(`${RELAYER_URL}/v1/pool`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).then((r) => (r.ok ? r.json() : null)),
  );
  return res as RelayerPool | null;
}

async function relayerHealth(): Promise<{ ok?: boolean; cluster?: string; deposits?: number } | null> {
  const res = await timed(
    fetch(`${RELAYER_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).then((r) => (r.ok ? r.json() : null)),
  );
  return res as { ok?: boolean; cluster?: string; deposits?: number } | null;
}

export async function fetchPoolLiveStats(): Promise<PoolLiveStats> {
  const mint = mintKey();
  const derived = mint ? deriveVault(mint) : null;
  const [poolJson, health, vaultBal, sigs] = await Promise.all([
    relayerPool(),
    relayerHealth(),
    derived
      ? timed(connection().getTokenAccountBalance(derived.vault))
      : Promise.resolve(null),
    derived
      ? timed(connection().getSignaturesForAddress(derived.pool, { limit: 1 }))
      : Promise.resolve(null),
  ]);

  const deposits =
    typeof poolJson?.depositCount === "number"
      ? poolJson.depositCount
      : typeof health?.deposits === "number"
        ? health.deposits
        : null;

  let tvlUi: string | null = null;
  let tvlSource: "vault" | "unavailable" = "unavailable";
  if (vaultBal && vaultBal.value) {
    tvlUi = vaultBal.value.uiAmountString ?? String(vaultBal.value.uiAmount ?? "");
    tvlSource = "vault";
  } else if (poolJson?.vaultBalanceUi) {
    tvlUi = poolJson.vaultBalanceUi;
    tvlSource = "vault";
  }

  let lastActivityIso: string | null = null;
  if (Array.isArray(sigs) && sigs[0]?.blockTime) {
    lastActivityIso = new Date(sigs[0].blockTime * 1000).toISOString();
  }

  return {
    deposits,
    tvlUi: tvlUi && tvlUi.length > 0 ? tvlUi : null,
    anonymitySet: deposits,
    lastActivityIso,
    relayerOk: health ? Boolean(health.ok) : null,
    cluster: health?.cluster || CLUSTER,
    pool: poolJson?.address || derived?.pool.toBase58() || (CLUSTER === "devnet" ? DEVNET.pool : null),
    vault: poolJson?.vault || derived?.vault.toBase58() || (CLUSTER === "devnet" ? DEVNET.vault : null),
    mint: poolJson?.mint || mint?.toBase58() || null,
    tvlSource,
  };
}

export async function fetchPoolActivity(): Promise<PoolActivityRow[]> {
  const rows: PoolActivityRow[] = [];
  try {
    const res = await fetch(`${RELAYER_URL}/v1/deposits`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) {
      const body = await res.json();
      const deposits = Array.isArray(body?.deposits) ? body.deposits : [];
      for (const d of deposits.slice().reverse().slice(0, 12)) {
        if (!d?.txSignature) continue;
        rows.push({
          kind: "deposit",
          signature: d.txSignature,
          at: d.createdAt ?? null,
          detail: typeof d.leafIndex === "number" ? `leaf ${d.leafIndex}` : undefined,
        });
      }
    }
  } catch {
    /* relayer optional */
  }

  const mint = mintKey();
  if (mint) {
    const { pool } = deriveVault(mint);
    const sigs = await timed(connection().getSignaturesForAddress(pool, { limit: 10 }));
    if (Array.isArray(sigs)) {
      const have = new Set(rows.map((r) => r.signature));
      for (const s of sigs) {
        if (have.has(s.signature)) continue;
        rows.push({
          kind: "pool",
          signature: s.signature,
          at: s.blockTime ? new Date(s.blockTime * 1000).toISOString() : null,
          detail: s.err ? "failed" : "on-chain",
        });
      }
    }
  }
  return rows.slice(0, 16);
}
