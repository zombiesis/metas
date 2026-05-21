import { logger } from '@/lib/logger';

const REQUIRED_VARS = ['DATABASE_URL', 'ENCRYPTION_KEY', 'SESSION_SECRET'] as const;
const PRODUCTION_VARS = ['INTERNAL_API_SECRET'] as const;
const PLACEHOLDER_VALUES = [
  'change-this-to-a-random-32-char-string',
  'change-this-to-a-32-char-random-string',
  'change-this-to-a-64-char-random-string',
  'replace-this-with',
  'metas-admin-change-me',
  'dev-local-encryption-key-change-in-prod',
];
const MIN_SECRET_LENGTH = 32;

/**
 * Reconcile the legacy `ADMIN_SESSION_SECRET` env var (used by older .env files
 * shipped with the project) onto the canonical `SESSION_SECRET` name. Avoids
 * silently failing 2FA logins for operators whose .env hasn't been migrated.
 */
function reconcileLegacyVars() {
  if (!process.env.SESSION_SECRET && process.env.ADMIN_SESSION_SECRET) {
    process.env.SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
    logger.warn(
      'ADMIN_SESSION_SECRET is deprecated — rename it to SESSION_SECRET in your .env. Continuing with the legacy value for now.',
    );
  }
}

export function validateEnv() {
  reconcileLegacyVars();

  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    logger.fatal({ missing }, 'Missing required environment variables');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    for (const key of PRODUCTION_VARS) {
      if (!process.env[key]) missing.push(key);
    }
    for (const key of REQUIRED_VARS) {
      const val = process.env[key] || '';
      if (PLACEHOLDER_VALUES.some((p) => val.includes(p))) {
        logger.fatal({ key }, `${key} contains a placeholder value. Set a real secret in production.`);
        process.exit(1);
      }
    }
    if ((process.env.SESSION_SECRET || '').length < MIN_SECRET_LENGTH) {
      logger.fatal(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production`);
      process.exit(1);
    }
    if ((process.env.ENCRYPTION_KEY || '').length < MIN_SECRET_LENGTH) {
      logger.fatal(`ENCRYPTION_KEY must be at least ${MIN_SECRET_LENGTH} characters in production`);
      process.exit(1);
    }
    // Trusted proxy must be explicit in production — without it, every request
    // shares an IP-rate-limit bucket of "0.0.0.0", trivially DoSing logins.
    if (!process.env.TRUST_PROXY) {
      logger.fatal('TRUST_PROXY is not set. Set TRUST_PROXY=cloudflare (or =nginx) so client IPs can be derived from headers.');
      process.exit(1);
    }
    if (missing.length > 0) {
      logger.fatal({ missing }, 'Missing required production environment variables');
      process.exit(1);
    }
  }

  logger.info('Environment validation passed');
}
