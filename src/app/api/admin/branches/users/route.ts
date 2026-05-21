import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const { branchId, userId } = await request.json();
  if (!branchId || !userId) return NextResponse.json({ ok: false, error: 'branchId and userId required' }, { status: 400 });

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId, branchId } },
    create: { userId, branchId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const { branchId, userId } = await request.json();
  if (!branchId || !userId) return NextResponse.json({ ok: false, error: 'branchId and userId required' }, { status: 400 });

  await prisma.userBranch.deleteMany({ where: { userId, branchId } });
  return NextResponse.json({ ok: true });
}
