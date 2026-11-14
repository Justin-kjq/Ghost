import { fetchLeafRecord, fetchPool } from "./solana.js";
import {
  commitmentHex,
  rebuildRoots,
  replaceDeposits,
  type StoredDeposit,
} from "./store.js";

const BATCH = 50;

/**
 * Rebuild the off-chain Merkle tree from on-chain LeafRecord PDAs.
 * Chain is the source of truth; the local file is only a cache.
 */
export async function syncFromChain(): Promise<{
  deposits: number;
  nextIndex: number;
  root: string;
}> {
  const pool = await fetchPool();
  const deposits: StoredDeposit[] = [];
  for (let i = 0; i < pool.nextIndex; i += BATCH) {
    const slice = await Promise.all(
      Array.from({ length: Math.min(BATCH, pool.nextIndex - i) }, (_, k) =>
        fetchLeafRecord(i + k),
      ),
    );
    for (let k = 0; k < slice.length; k++) {
      const rec = slice[k];
      if (!rec) {
        throw new Error(`Missing LeafRecord at index ${i + k} — pool.next_index=${pool.nextIndex}`);
      }
      deposits.push({
        leafIndex: rec.leafIndex,
        commitment: commitmentHex(rec.commitment),
        createdAt: new Date().toISOString(),
      });
    }
  }
  replaceDeposits(deposits);
  const { root } = await rebuildRoots();
  return { deposits: deposits.length, nextIndex: pool.nextIndex, root };
}
