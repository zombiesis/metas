import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/cms-db';
import { auditLog } from '@/lib/audit';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  return NextResponse.json({ ok: true, site: await getSiteSettings() });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'edit')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const data = await request.json();
  const before = await getSiteSettings();
  const branchId = await (await import('@/lib/tenant')).getCurrentBranchId();
  const row = await prisma.siteSetting.upsert({ where: { key_branchId: { key: 'site', branchId: branchId || '' } }, create: { key: 'site', branchId, label: 'Site settings', group: 'global', value: JSON.stringify(data), updatedBy: auth.session!.username }, update: { value: JSON.stringify(data), updatedBy: auth.session!.username } });
  await auditLog({ action: 'updated_settings', entityType: 'SiteSetting', entityId: row.id, summary: 'Updated global site settings', userId: auth.session!.userId, beforeValue: before, afterValue: data, request });
  return NextResponse.json({ ok: true, site: data });
}
