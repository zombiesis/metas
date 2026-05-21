import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import { invalidateDomainCache } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST: suspend or resume a branch */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const { branchId, action } = await request.json();
  if (!branchId || !['suspend', 'resume'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'branchId and action (suspend|resume) required' }, { status: 400 });
  }

  const newStatus = action === 'suspend' ? 'suspended' : 'active';
  const branch = await prisma.branch.update({ where: { id: branchId }, data: { status: newStatus } });
  invalidateDomainCache();

  await auditLog({ action: `branch_${action}`, entityType: 'Branch', entityId: branchId, summary: `${branch.name} ${action}ed`, userId: auth.session!.userId, request });
  return NextResponse.json({ ok: true, branch: { id: branch.id, name: branch.name, status: branch.status } });
}
