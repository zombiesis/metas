import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const branchId = await getCurrentBranchId();
  const workflows = await prisma.workflow.findMany({ where: branchId ? { branchId } : {}, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ ok: true, workflows: workflows.map(w => ({ ...w, conditions: JSON.parse(w.conditions), actions: JSON.parse(w.actions) })) });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'create')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { name, trigger, conditions, actions } = await request.json();
  if (!name || !trigger) return NextResponse.json({ ok: false, error: 'name and trigger required' }, { status: 400 });

  const branchId = await getCurrentBranchId();
  const workflow = await prisma.workflow.create({ data: { branchId, name, trigger, conditions: JSON.stringify(conditions || []), actions: JSON.stringify(actions || []), createdBy: auth.session!.username } });
  return NextResponse.json({ ok: true, workflow });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'edit')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { id, name, trigger, conditions, actions, enabled } = await request.json();
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });

  const workflow = await prisma.workflow.update({ where: { id }, data: { ...(name ? { name } : {}), ...(trigger ? { trigger } : {}), ...(conditions ? { conditions: JSON.stringify(conditions) } : {}), ...(actions ? { actions: JSON.stringify(actions) } : {}), ...(enabled !== undefined ? { enabled } : {}) } });
  return NextResponse.json({ ok: true, workflow });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'delete')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const { id } = await request.json();
  await prisma.workflow.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
