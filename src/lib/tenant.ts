import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

const DEFAULT_BRANCH_ID = process.env.DEFAULT_BRANCH_ID || null;

// In-memory cache: domain → branchId (5 min TTL)
const cache = new Map<string, { branchId: string; expires: number }>();
const TTL = 5 * 60 * 1000;

export async function resolveBranchByDomain(domain: string): Promise<string | null> {
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

/** Get the current branch ID from request host (resolved via domain lookup) */
export async function getCurrentBranchId(): Promise<string | null> {
  const h = await headers();
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
