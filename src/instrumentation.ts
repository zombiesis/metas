export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { prisma } = await import('@/lib/prisma');
    const { logger } = await import('@/lib/logger');
    const { validateEnv } = await import('@/lib/env');

    // Validate environment variables
    validateEnv();

    // Verify database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection verified');
    } catch (err) {
      logger.fatal({ err }, 'Database connection failed on startup');
    }

    // Initialize Redis rate limiter if configured
    if (process.env.REDIS_URL) {
      const { initRedisRateLimiter } = await import('@/lib/rate-limiter');
      initRedisRateLimiter();
      logger.info('Redis rate limiter initialized');
    }
  }
}
