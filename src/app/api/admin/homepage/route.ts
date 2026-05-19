import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getHomepageSections } from '@/lib/cms-db';
import { auditLog } from '@/lib/audit';
import { can } from '@/lib/rbac';
import { sanitizeRichText } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  return NextResponse.json({ ok: true, sections: await getHomepageSections() });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!can(auth.session!.roleName, 'edit')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const { sections } = await request.json();
  if (!Array.isArray(sections)) return NextResponse.json({ ok: false, error: 'Invalid homepage payload.' }, { status: 400 });
  const before = await getHomepageSections();
  for (const section of sections) {
    await prisma.homepageSection.upsert({
      where: { key: String(section.key) },
      create: {
        key: String(section.key),
        title: section.title || null,
        subtitle: section.subtitle || null,
        body: sanitizeRichText(String(section.body || '')),
        order: Number(section.order || 0),
        visible: Boolean(section.visible),
        status: section.status || 'draft',
        settings: JSON.stringify(section.settings || {}),
        updatedBy: auth.session!.username,
        createdBy: auth.session!.username
      },
      update: {
        title: section.title || null,
        subtitle: section.subtitle || null,
        body: sanitizeRichText(String(section.body || '')),
        order: Number(section.order || 0),
        visible: Boolean(section.visible),
        status: section.status || 'draft',
        settings: JSON.stringify(section.settings || {}),
        updatedBy: auth.session!.username
      }
    });
  }
  const saved = await getHomepageSections();
  await auditLog({ action: 'updated_homepage', entityType: 'HomepageSection', summary: 'Updated homepage sections', userId: auth.session!.userId, beforeValue: before, afterValue: saved, request });
  return NextResponse.json({ ok: true, sections: saved });
}
