import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const branchId = await getCurrentBranchId();
  const w = branchId ? { branchId } : {};
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    totalPages, totalPrograms, totalNotices, totalFaculty,
    totalAdmissions, totalForms, totalContacts,
    admissionsThisMonth, formsThisWeek,
    recentEvents
  ] = await Promise.all([
    prisma.page.count({ where: { ...w, status: 'published' } }).catch(() => 0),
    prisma.program.count({ where: { ...w, status: 'published' } }).catch(() => 0),
    prisma.notice.count({ where: { ...w, status: 'active' } }).catch(() => 0),
    prisma.faculty.count({ where: { ...w, status: 'published' } }).catch(() => 0),
    prisma.admissionLead.count({ where: w }).catch(() => 0),
    prisma.formSubmission.count({ where: w }).catch(() => 0),
    prisma.contactInquiry.count({ where: w }).catch(() => 0),
    prisma.admissionLead.count({ where: { ...w, createdAt: { gte: thirtyDaysAgo } } }).catch(() => 0),
    prisma.formSubmission.count({ where: { ...w, createdAt: { gte: sevenDaysAgo } } }).catch(() => 0),
    prisma.event.findMany({ where: { ...w, startDate: { gte: now } }, orderBy: { startDate: 'asc' }, take: 5, select: { id: true, title: true, startDate: true } }).catch(() => []),
  ]);

  return NextResponse.json({
    ok: true,
    branchId,
    content: { pages: totalPages, programs: totalPrograms, notices: totalNotices, faculty: totalFaculty },
    crm: { admissions: totalAdmissions, forms: totalForms, contacts: totalContacts },
    trends: { admissionsThisMonth, formsThisWeek },
    upcoming: recentEvents,
  });
}
