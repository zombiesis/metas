import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, userAgent } from '@/lib/security';
import { getCurrentBranchId } from '@/lib/tenant';

/** Cap before/after JSON to keep one heavy edit from bloating the audit table (N24). */
const MAX_AUDIT_BLOB_BYTES = 16 * 1024;
function safeJsonStringify(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    serialized = '"[unserializable]"';
  }
  if (serialized.length <= MAX_AUDIT_BLOB_BYTES) return serialized;
  return JSON.stringify({ truncated: true, originalBytes: serialized.length, preview: serialized.slice(0, MAX_AUDIT_BLOB_BYTES - 200) });
}

export async function auditLog(args: { action: string; entityType: string; entityId?: string; summary?: string; userId?: string; beforeValue?: unknown; afterValue?: unknown; request?: NextRequest }) {
  try {
    // Resolve branchId once at write time so multi-tenant filtering on read is
    // a simple equality check, not a UserBranch join (N12+N15). Resolution can
    // throw outside an HTTP request context (e.g. background jobs); we just
    // let it be null in that case.
    let branchId: string | null = null;
    try { branchId = await getCurrentBranchId(); } catch { branchId = null; }
    await prisma.auditLog.create({
      data: {
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId,
        summary: args.summary,
        userId: args.userId,
        branchId: branchId ?? undefined,
        beforeValue: safeJsonStringify(args.beforeValue),
        afterValue: safeJsonStringify(args.afterValue),
        ipAddress: args.request ? clientIp(args.request) : undefined,
        userAgent: args.request ? userAgent(args.request) : undefined,
      },
    });
  } catch {
    // Audit logging should not crash content operations.
  }
}
