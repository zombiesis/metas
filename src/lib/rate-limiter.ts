import type { Redis } from 'ioredis';

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): RateLimitResult | Promise<RateLimitResult>;
}

/** In-memory rate limiter (single-instance only). */
export class MemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, { count: number; reset: number }>();

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.reset < now) {
      this.buckets.set(key, { count: 1, reset: now + windowMs });
      return { ok: true, remaining: limit - 1, reset: now + windowMs };
    }
    bucket.count++;
    return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), reset: bucket.reset };
  }
}

/**
 * Redis rate limiter backed by `ioredis`.
 *
 * Audit-#2 N6: the previous implementation hand-rolled a Redis client over raw
 * TCP. It only parsed simple-line responses (`+`, `-`, `:`), couldn't handle
 * bulk strings or arrays, had a connect-vs-write race, and had no TLS support
 * for `rediss://` URLs. `ioredis` covers all of that, plus reconnect, command
 * pipelining, and `select`.
 */
export class RedisRateLimiter implements RateLimiter {
  private fallback = new MemoryRateLimiter();

  constructor(private redis: Redis) {}

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const redisKey = `rl:${key}`;
    try {
      // Pipeline INCR + PEXPIRE + PTTL so we cost one round-trip, not three.
      const results = await this.redis
        .multi()
        .incr(redisKey)
        .pexpire(redisKey, windowMs, 'NX')
        .pttl(redisKey)
        .exec();
      if (!results) throw new Error('Redis pipeline returned null');
      const count = (results[0]?.[1] as number) ?? 0;
      const ttl = (results[2]?.[1] as number) ?? 0;
      return { ok: count <= limit, remaining: Math.max(0, limit - count), reset: Date.now() + Math.max(ttl, 0) };
    } catch {
      // On any Redis hiccup, degrade gracefully to in-memory accounting rather
      // than letting a transient outage take down the login form.
      return this.fallback.check(key, limit, windowMs);
    }
  }
}

/** Build a Redis client from `REDIS_URL`. Returns null if the env var is unset. */
async function buildRedisClient(): Promise<Redis | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  const { default: IORedis } = await import('ioredis');
  return new IORedis(redisUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    // ioredis auto-detects TLS for `rediss://` URLs via the URL parser.
  });
}

/** Initialize Redis rate limiter from environment. Idempotent. */
export async function initRedisRateLimiter() {
  const client = await buildRedisClient();
  if (client) setRateLimiter(new RedisRateLimiter(client));
}

let instance: RateLimiter = new MemoryRateLimiter();

/** Set a custom rate limiter (e.g., Redis-backed). */
export function setRateLimiter(limiter: RateLimiter) {
  instance = limiter;
}

/** Get the active rate limiter. */
export function getRateLimiter(): RateLimiter {
  return instance;
}
