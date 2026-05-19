export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): RateLimitResult | Promise<RateLimitResult>;
}

/** In-memory rate limiter (single-instance only) */
class MemoryRateLimiter implements RateLimiter {
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
 * Redis rate limiter stub — implement with your Redis client.
 * Example: new RedisRateLimiter(ioredisClient)
 */
// class RedisRateLimiter implements RateLimiter {
//   constructor(private redis: any) {}
//   async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
//     const redisKey = `rl:${key}`;
//     const count = await this.redis.incr(redisKey);
//     if (count === 1) await this.redis.pexpire(redisKey, windowMs);
//     const ttl = await this.redis.pttl(redisKey);
//     return { ok: count <= limit, remaining: Math.max(0, limit - count), reset: Date.now() + Math.max(ttl, 0) };
//   }
// }

let instance: RateLimiter = new MemoryRateLimiter();

/** Set a custom rate limiter (e.g., Redis-backed) */
export function setRateLimiter(limiter: RateLimiter) {
  instance = limiter;
}

/** Get the active rate limiter */
export function getRateLimiter(): RateLimiter {
  return instance;
}
