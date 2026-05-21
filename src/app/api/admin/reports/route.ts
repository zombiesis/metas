import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'view_analytics')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const branchId = await getCurrentBranchId();
  const w = branchId ? { branchId } : {};
  const type = request.nextUrl.searchParams.get('type') || 'admissions_by_month';
  const months = Math.min(24, Math.max(1, parseInt(request.nextUrl.searchParams.get('months') || '12')));

  switch (type) {
    case 'admissions_by_month': {
      const data = await getMonthlyData(prisma.admissionLead, w, months);
      return NextResponse.json({ ok: true, type, data });
    }
    case 'forms_by_source': {
      const rows = await prisma.formSubmission.groupBy({ by: ['utmSource'], where: w, _count: true, orderBy: { _count: { utmSource: 'desc' } }, take: 20 });
      return NextResponse.json({ ok: true, type, data: rows.map(r => ({ source: r.utmSource || 'Direct', count: r._count })) });
    }
    case 'admissions_by_program': {
      const rows = await prisma.admissionLead.groupBy({ by: ['program'], where: w, _count: true, orderBy: { _count: { program: 'desc' } } });
      return NextResponse.json({ ok: true, type, data: rows.map(r => ({ program: r.program || 'Not specified', count: r._count })) });
    }
    case 'admissions_by_status': {
      const rows = await prisma.admissionLead.groupBy({ by: ['status'], where: w, _count: true });
      return NextResponse.json({ ok: true, type, data: rows.map(r => ({ status: r.status, count: r._count })) });
    }
    case 'forms_by_kind': {
      const rows = await prisma.formSubmission.groupBy({ by: ['kind'], where: w, _count: true });
      return NextResponse.json({ ok: true, type, data: rows.map(r => ({ kind: r.kind, count: r._count })) });
    }
    case 'content_summary': {
      const [pages, programs, notices, faculty, events] = await Promise.all([
        prisma.page.count({ where: { ...w, status: 'published' } }),
        prisma.program.count({ where: { ...w, status: 'published' } }),
        prisma.notice.count({ where: { ...w, status: 'active' } }),
        prisma.faculty.count({ where: { ...w, status: 'published' } }),
        prisma.event.count({ where: w }),
      ]);
      return NextResponse.json({ ok: true, type, data: { pages, programs, notices, faculty, events } });
    }
    default:
      return NextResponse.json({ ok: false, error: 'Unknown report type' }, { status: 400 });
  }
}

async function getMonthlyData(model: any, where: any, months: number) {
  const now = new Date();
  const data: { month: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = await model.count({ where: { ...where, createdAt: { gte: start, lt: end } } }).catch(() => 0);
    data.push({ month: start.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), count });
  }
  return data;
}
