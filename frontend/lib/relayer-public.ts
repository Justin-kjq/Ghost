import { RELAYER_URL } from "./config";

export type RelayerStats = {
  ok: boolean;
  cluster?: string;
  deposits?: number;
};

export async function fetchRelayerStats(): Promise<RelayerStats | null> {
  try {
    const healthRes = await fetch(`${RELAYER_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!healthRes.ok) return null;
    const health = (await healthRes.json()) as RelayerStats;
    try {
      const poolRes = await fetch(`${RELAYER_URL}/v1/pool`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      });
      if (poolRes.ok) {
        const pool = await poolRes.json();
        if (typeof pool.depositCount === "number") {
          health.deposits = pool.depositCount;
        }
      }
    } catch {
      /* health deposits is enough */
    }
    return health;
  } catch {
    return null;
  }
}
