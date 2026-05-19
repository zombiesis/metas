import { logger } from '@/lib/logger';

const REQUIRED_VARS = ['DATABASE_URL', 'ENCRYPTION_KEY'] as const;
const PRODUCTION_VARS = ['SESSION_SECRET'] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  if (process.env.NODE_ENV === 'production') {
    for (const key of PRODUCTION_VARS) {
      if (!process.env[key]) missing.push(key);
    }
    if (process.env.ENCRYPTION_KEY === 'change-this-to-a-random-32-char-string') {
      logger.fatal('ENCRYPTION_KEY is still the default value. Set a real secret in production.');
      process.exit(1);
    }
  }

  if (missing.length > 0) {
    logger.fatal({ missing }, 'Missing required environment variables');
    process.exit(1);
  }

  logger.info('Environment validation passed');
}
