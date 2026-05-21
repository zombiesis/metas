import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Branch-specific email notification settings.
 * Stored in SiteSetting with key = 'email_config' scoped by branchId.
 */

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const branchId = await getCurrentBranchId();
  const setting = await prisma.siteSetting.findFirst({ where: { key: 'email_config', branchId } }).catch(() => null);
  const config = setting ? JSON.parse(setting.value) : { notificationEmail: '', admissionsEmail: '', replyTo: '', enabled: false };
  return NextResponse.json({ ok: true, config });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'edit')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const branchId = await getCurrentBranchId();
  const config = await request.json();

  await prisma.siteSetting.upsert({
    where: { key_branchId: { key: 'email_config', branchId: branchId || '' } },
    create: { key: 'email_config', branchId, value: JSON.stringify(config), label: 'Email Notifications', group: 'notifications', updatedBy: auth.session!.username },
    update: { value: JSON.stringify(config), updatedBy: auth.session!.username },
  });

  return NextResponse.json({ ok: true });
}
