import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import { sanitizeRichText } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: export all branch content as JSON */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'export')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const branchId = await getCurrentBranchId();
  const w = branchId ? { branchId } : {};

  const [pages, programs, notices, documents, faculty, events, blogs, careers, homepage] = await Promise.all([
    prisma.page.findMany({ where: { ...w, deletedAt: null } }),
    prisma.program.findMany({ where: { ...w, deletedAt: null } }),
    prisma.notice.findMany({ where: { ...w, deletedAt: null } }),
    prisma.document.findMany({ where: w }),
    prisma.faculty.findMany({ where: w }),
    prisma.event.findMany({ where: w }),
    prisma.blogPost.findMany({ where: w }),
    prisma.jobOpening.findMany({ where: w }),
    prisma.homepageSection.findMany({ where: w }),
  ]);

  const exportData = { exportedAt: new Date().toISOString(), branchId, pages, programs, notices, documents, faculty, events, blogs, careers, homepage };

  await auditLog({ action: 'bulk_export', entityType: 'Branch', entityId: branchId || 'all', summary: 'Exported branch content as JSON', userId: auth.session!.userId });
  return new NextResponse(JSON.stringify(exportData, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="branch-export-${branchId || 'all'}.json"` } });
}

/** POST: import content from JSON into current branch */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'create')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const branchId = await getCurrentBranchId();
  if (!branchId) return NextResponse.json({ ok: false, error: 'No branch selected' }, { status: 400 });

  const data = await request.json();
  const results: Record<string, number> = {};

  if (data.pages?.length) {
    for (const p of data.pages) {
      await prisma.page.create({ data: { branchId, slug: `${p.slug}-import`, locale: p.locale || 'en', title: p.title, summary: p.summary, body: sanitizeRichText(p.body || ''), status: 'draft', seoTitle: p.seoTitle, seoDescription: p.seoDescription, metadata: p.metadata || '{}', createdBy: auth.session!.username, updatedBy: auth.session!.username } }).catch(() => null);
    }
    results.pages = data.pages.length;
  }

  if (data.programs?.length) {
    for (const p of data.programs) {
      await prisma.program.create({ data: { branchId, slug: `${p.slug}-import`, locale: p.locale || 'en', title: p.title, category: p.category || 'General', status: 'draft', duration: p.duration, eligibility: p.eligibility, summary: p.summary, overview: p.overview, faqs: p.faqs || '[]', rules: p.rules || '[]', documents: p.documents || '[]', facultyIds: p.facultyIds || '[]', createdBy: auth.session!.username, updatedBy: auth.session!.username } }).catch(() => null);
    }
    results.programs = data.programs.length;
  }

  if (data.notices?.length) {
    for (const n of data.notices) {
      await prisma.notice.create({ data: { branchId, slug: `${n.slug}-import`, locale: n.locale || 'en', title: n.title, category: n.category || 'General', status: 'draft', body: n.body, pinned: n.pinned || false, createdBy: auth.session!.username, updatedBy: auth.session!.username } }).catch(() => null);
    }
    results.notices = data.notices.length;
  }

  await auditLog({ action: 'bulk_import', entityType: 'Branch', entityId: branchId, summary: `Imported ${Object.values(results).reduce((a, b) => a + b, 0)} records`, userId: auth.session!.userId, request });
  return NextResponse.json({ ok: true, results });
}
