type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Simple in-memory per-key hourly limit. */
export function takeRateLimit(
  key: string,
  maxPerHour: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + hour };
    buckets.set(key, bucket);
  }
  if (bucket.count >= maxPerHour) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { ok: true };
}

/** Test helper */
export function resetRateLimits() {
  buckets.clear();
}
