import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __metasPrisma: PrismaClient | undefined;
}

const hasDb = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder');

function createClient(): PrismaClient | null {
  if (!hasDb) return null;
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    });
  } catch {
    return null;
  }
}

const _prisma: PrismaClient | null = global.__metasPrisma ?? createClient();

if (process.env.NODE_ENV !== 'production' && _prisma) {
  global.__metasPrisma = _prisma;
}

/** True when a database connection is configured */
export const dbAvailable = _prisma !== null;

/**
 * Prisma client instance. Typed as non-null for convenience in admin routes
 * (which are auth-gated and will 401 before reaching DB code when no DB exists).
 * Public code should check `dbAvailable` or use optional chaining.
 */
export const prisma = _prisma as PrismaClient;

/** Non-null prisma for admin routes that require DB. Throws if DB unavailable. */
export function requireDb(): PrismaClient {
  if (!_prisma) throw new Error('Database not available');
  return _prisma;
}
