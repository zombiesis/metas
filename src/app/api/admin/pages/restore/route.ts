import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'edit')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const form = await request.formData();
  const versionId = String(form.get('versionId') || '');
  const version = await prisma.pageVersion.findUnique({ where: { id: versionId }, include: { page: true } });
  if (!version) return NextResponse.json({ ok: false, error: 'Version not found.' }, { status: 404 });
  const snapshot = JSON.parse(version.snapshot);
  const restored = await prisma.page.update({ where: { id: version.pageId }, data: { title: snapshot.title, summary: snapshot.summary, body: snapshot.body, status: 'draft', seoTitle: snapshot.seoTitle, seoDescription: snapshot.seoDescription, metadata: snapshot.metadata, updatedBy: auth.session!.username } });
  await auditLog({ action: 'restored_version', entityType: 'Page', entityId: restored.id, summary: `Restored ${restored.slug} from version ${version.version}`, userId: auth.session!.userId, afterValue: restored, request });
  return NextResponse.redirect(new URL('/admin/pages/versions?restored=1', request.url), { status: 303 });
}
