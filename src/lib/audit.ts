import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, userAgent } from '@/lib/security';

export async function auditLog(args: { action: string; entityType: string; entityId?: string; summary?: string; userId?: string; beforeValue?: unknown; afterValue?: unknown; request?: NextRequest }) {
  try {
    await prisma.auditLog.create({
      data: {
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId,
        summary: args.summary,
        userId: args.userId,
        beforeValue: args.beforeValue === undefined ? undefined : JSON.stringify(args.beforeValue),
        afterValue: args.afterValue === undefined ? undefined : JSON.stringify(args.afterValue),
        ipAddress: args.request ? clientIp(args.request) : undefined,
        userAgent: args.request ? userAgent(args.request) : undefined
      }
    });
  } catch {
    // Audit logging should not crash content operations.
  }
}
