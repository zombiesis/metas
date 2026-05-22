import { headers } from 'next/headers';
import { prisma, dbAvailable } from '@/lib/prisma';
import { BRANCH_COOKIE, verifyBranchCookie } from '@/lib/branch-cookie';
import { SESSION_COOKIE } from '@/lib/session-constants';

const DEFAULT_BRANCH_ID = process.env.DEFAULT_BRANCH_ID || null;

// In-memory cache: domain → branchId (5 min TTL)
const cache = new Map<string, { branchId: string; expires: number }>();
const TTL = 5 * 60 * 1000;

export async function resolveBranchByDomain(domain: string): Promise<string | null> {
  if (!dbAvailable) return DEFAULT_BRANCH_ID;
  const cached = cache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.branchId;

  const record = await prisma.branchDomain.findUnique({
    where: { domain },
    select: { branchId: true, branch: { select: { status: true } } },
  }).catch(() => null);

  if (record && record.branch.status === 'active') {
    cache.set(domain, { branchId: record.branchId, expires: Date.now() + TTL });
    return record.branchId;
  }

  return DEFAULT_BRANCH_ID;
}

/** Read userId from the active admin session cookie WITHOUT touching `lastActiveAt`. */
async function readActiveSessionUserId(cookieHeader: string): Promise<string | null> {
  if (!dbAvailable) return null;
  const cookieMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!cookieMatch) return null;
  const raw = decodeURIComponent(cookieMatch[1]);
  const dot = raw.indexOf('.');
  if (dot < 1) return null;
  const sessionId = raw.slice(0, dot);
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true, expiresAt: true },
  }).catch(() => null);
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return session.userId;
}

/**
 * Get the current branch ID.
 *
 * Resolution order:
 *   1. HMAC-signed admin branch cookie (only honoured when the cookie's userId
 *      matches the active admin session — see branch-cookie.ts).
 *   2. Domain → branch lookup based on the request host.
 *   3. DEFAULT_BRANCH_ID env fallback (or null).
 *
 * Step 1 deliberately ignores unsigned/forged cookies — fixing the previous
 * "set the cookie to anything" multi-tenant bypass.
 */
export async function getCurrentBranchId(): Promise<string | null> {
  const h = await headers();
  const cookieHeader = h.get('cookie') || '';

  const branchMatch = cookieHeader.match(new RegExp(`${BRANCH_COOKIE}=([^;]+)`));
  if (branchMatch) {
    const verified = verifyBranchCookie(decodeURIComponent(branchMatch[1]));
    if (verified) {
      const sessionUserId = await readActiveSessionUserId(cookieHeader);
      if (sessionUserId && sessionUserId === verified.userId) {
        return verified.branchId;
      }
    }
  }

  const host = h.get('x-branch-host') || h.get('host')?.split(':')[0] || 'localhost';
  return resolveBranchByDomain(host);
}

/** Build a where clause scoped to the current branch */
export async function branchWhere(extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const branchId = await getCurrentBranchId();
  if (!branchId) return extra;
  return { ...extra, branchId };
}

/** Invalidate cache for a domain (call after domain config changes) */
export function invalidateDomainCache(domain?: string) {
  if (domain) cache.delete(domain);
  else cache.clear();
}
