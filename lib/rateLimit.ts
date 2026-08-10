// Simple in-memory fixed-window rate limiter.
//
// This is intentionally lightweight and has a real limitation: it's
// per-server-instance memory, so it resets on redeploy/restart and does NOT
// share state across multiple serverless instances or horizontally scaled
// servers. For a multi-instance production deployment, replace this with a
// shared store (e.g. Upstash Redis, Vercel KV) keyed the same way.
//
// It's still meaningfully better than nothing: it stops a single attacker
// hammering one instance, and costs zero extra infra for a small deployment.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// periodic cleanup so the map doesn't grow unbounded under sustained traffic
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Returns { allowed, remaining, resetAt } for the given key.
 * Call once per incoming request; if `allowed` is false, reject the request.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Best-effort client IP extraction behind common proxies/load balancers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
