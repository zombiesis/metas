import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';

/**
 * Returns a where clause that scopes queries to the current branch.
 * If no branch is resolved (e.g., during migration), returns empty object (no filter).
 */
export async function scopedWhere(extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const branchId = await getCurrentBranchId();
  if (!branchId) return extra;
  return { ...extra, branchId };
}

/**
 * Wraps a Prisma findMany call with automatic branch scoping.
 */
export async function tenantFindMany<T>(
  model: { findMany: (args: any) => Promise<T[]> },
  args: Record<string, unknown> = {}
): Promise<T[]> {
  const branchId = await getCurrentBranchId();
  const where = branchId ? { ...((args.where as any) || {}), branchId } : args.where || {};
  return model.findMany({ ...args, where });
}

/**
 * Wraps a Prisma count call with automatic branch scoping.
 */
export async function tenantCount(
  model: { count: (args?: any) => Promise<number> },
  args: Record<string, unknown> = {}
): Promise<number> {
  const branchId = await getCurrentBranchId();
  const where = branchId ? { ...((args.where as any) || {}), branchId } : args.where || {};
  return model.count({ ...args, where });
}

/**
 * Returns the branchId to attach when creating new records.
 */
export async function tenantCreateData(): Promise<{ branchId?: string }> {
  const branchId = await getCurrentBranchId();
  return branchId ? { branchId } : {};
}

export { prisma };
