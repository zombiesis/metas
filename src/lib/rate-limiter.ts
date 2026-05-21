export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): RateLimitResult | Promise<RateLimitResult>;
}

/** In-memory rate limiter (single-instance only) */
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

/**
 * Redis rate limiter — activate by calling setRateLimiter(new RedisRateLimiter(redisUrl))
 * at app startup. Falls back to in-memory if not configured.
 */
class RedisRateLimiter implements RateLimiter {
  private redis: { incr: (key: string) => Promise<number>; pexpire: (key: string, ms: number) => Promise<void>; pttl: (key: string) => Promise<number> };

  constructor(redisUrl: string) {
    // Lazy import — only loads if Redis is configured
    const url = new URL(redisUrl);
    this.redis = createMinimalRedisClient(url);
  }

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const redisKey = `rl:${key}`;
    try {
      const count = await this.redis.incr(redisKey);
      if (count === 1) await this.redis.pexpire(redisKey, windowMs);
      const ttl = await this.redis.pttl(redisKey);
      return { ok: count <= limit, remaining: Math.max(0, limit - count), reset: Date.now() + Math.max(ttl, 0) };
    } catch {
      // Fallback to memory limiter on Redis failure (not ok:true)
      return new MemoryRateLimiter().check(key, limit, windowMs);
    }
  }
}

/** Minimal Redis client using raw TCP (no dependency needed) */
function createMinimalRedisClient(url: URL) {
  let pending: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];
  let buffer = '';
  let socket: any = null;

  function connect() {
    if (socket) return;
    const net = require('node:net');
    socket = net.createConnection({ host: url.hostname, port: parseInt(url.port || '6379') });
    if (url.password) send(`AUTH ${url.password}\r\n`);
    socket.on('data', (data: Buffer) => {
      buffer += data.toString();
      while (buffer.includes('\r\n')) {
        const line = buffer.slice(0, buffer.indexOf('\r\n'));
        buffer = buffer.slice(buffer.indexOf('\r\n') + 2);
        const p = pending.shift();
        if (p) {
          if (line.startsWith('-')) p.reject(new Error(line));
          else if (line.startsWith(':')) p.resolve(parseInt(line.slice(1)));
          else p.resolve(line.startsWith('+') ? line.slice(1) : line);
        }
      }
    });
    socket.on('error', () => { socket = null; pending.forEach(p => p.reject(new Error('Redis disconnected'))); pending = []; });
  }

  function send(cmd: string): Promise<any> {
    connect();
    return new Promise((resolve, reject) => { pending.push({ resolve, reject }); socket.write(cmd); });
  }

  return {
    incr: (key: string) => send(`INCR ${key}\r\n`),
    pexpire: (key: string, ms: number) => send(`PEXPIRE ${key} ${ms}\r\n`),
    pttl: (key: string) => send(`PTTL ${key}\r\n`),
  };
}

/** Initialize Redis rate limiter from environment */
export function initRedisRateLimiter() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    setRateLimiter(new RedisRateLimiter(redisUrl));
  }
}

let instance: RateLimiter = new MemoryRateLimiter();

/** Set a custom rate limiter (e.g., Redis-backed) */
export function setRateLimiter(limiter: RateLimiter) {
  instance = limiter;
}

/** Get the active rate limiter */
export function getRateLimiter(): RateLimiter {
  return instance;
}
