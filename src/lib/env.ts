import { logger } from '@/lib/logger';

const REQUIRED_VARS = ['DATABASE_URL', 'ENCRYPTION_KEY', 'SESSION_SECRET'] as const;
const PRODUCTION_VARS = ['INTERNAL_API_SECRET'] as const;
const PLACEHOLDER_VALUES = ['change-this-to-a-random-32-char-string', 'replace-this-with', 'metas-admin-change-me'];

export function validateEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  if (process.env.NODE_ENV === 'production') {
    for (const key of PRODUCTION_VARS) {
      if (!process.env[key]) missing.push(key);
    }
    // Check for placeholder values in production
    for (const key of REQUIRED_VARS) {
      const val = process.env[key] || '';
      if (PLACEHOLDER_VALUES.some(p => val.includes(p))) {
        logger.fatal(`${key} contains a placeholder value. Set a real secret in production.`);
        process.exit(1);
      }
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
