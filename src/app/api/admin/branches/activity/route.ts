import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: recent audit log entries for the current branch's users */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const branchId = await getCurrentBranchId();
  const limit = Math.min(50, parseInt(request.nextUrl.searchParams.get('limit') || '20'));

  // Get users assigned to this branch
  let userIds: string[] = [];
  if (branchId) {
    const assignments = await prisma.userBranch.findMany({ where: { branchId }, select: { userId: true } });
    userIds = assignments.map(a => a.userId);
  }

  const where = userIds.length ? { userId: { in: userIds } } : {};
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { username: true, email: true } } },
  });

  return NextResponse.json({
    ok: true,
    branchId,
    activity: logs.map(l => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      summary: l.summary,
      user: l.user?.username || 'System',
      createdAt: l.createdAt,
    })),
  });
}
