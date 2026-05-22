export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { dbAvailable } = await import('@/lib/prisma');
    const { logger } = await import('@/lib/logger');

    if (!dbAvailable) {
      logger.warn('DATABASE_URL not configured — running in static/file-fallback mode');
      return;
    }

    const { validateEnv } = await import('@/lib/env');
    try { validateEnv(); } catch { /* non-fatal in degraded mode */ }

    const { prisma } = await import('@/lib/prisma');
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection verified');
    } catch (err) {
      logger.warn({ err }, 'Database connection failed on startup — running in fallback mode');
    }

    if (process.env.REDIS_URL) {
      const { initRedisRateLimiter } = await import('@/lib/rate-limiter');
      await initRedisRateLimiter();
      logger.info('Redis rate limiter initialized');
    }
  }
}
