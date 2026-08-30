// Production-ready fixed-window rate limiter.
// Strategy:
//  - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses Upstash Redis
//    via REST (shared across serverless instances) — suitable for Vercel production.
//  - Otherwise falls back to in-memory Map (single-instance, resets on restart).
//    The fallback is documented and still better than nothing for local/small deploys,
//    but will not protect against distributed attacks across multiple instances.

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

let redisClient: { incr: (key: string) => Promise<number>; expire: (key: string, sec: number) => Promise<unknown>; ttl: (key: string) => Promise<number> } | null = null;
let redisInitAttempted = false;

async function getRedis() {
  if (redisInitAttempted) return redisClient;
  redisInitAttempted = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    // dynamic import so the package is optional — no hard dependency unless env is set
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({ url, token }) as unknown as typeof redisClient;
    return redisClient;
  } catch {
    console.warn("[rateLimit] UPSTASH env set but @upstash/redis not installed — falling back to memory");
    return null;
  }
}

/**
 * Returns { allowed, remaining, resetAt } for the given key.
 * Call once per incoming request; if `allowed` is false, reject the request.
 * Async to support Redis backend; memory fallback remains synchronous.
 */
export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = await getRedis();
  if (redis) {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, Math.ceil(windowMs / 1000));
      }
      const ttl = await redis.ttl(redisKey);
      const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs);
      if (count > limit) {
        return { allowed: false, remaining: 0, resetAt };
      }
      return { allowed: true, remaining: Math.max(0, limit - count), resetAt };
    } catch (e) {
      console.error("[rateLimit] Redis error, falling back to memory:", e);
    }
  }

  // memory fallback
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
