import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: compare all branches side-by-side (Super Admin only) */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const branches = await prisma.branch.findMany({ where: { status: 'active' }, select: { id: true, name: true, slug: true } });

  const comparison = await Promise.all(branches.map(async (branch) => {
    const w = { branchId: branch.id };
    const [pages, programs, notices, faculty, admissions, forms] = await Promise.all([
      prisma.page.count({ where: { ...w, status: 'published' } }).catch(() => 0),
      prisma.program.count({ where: { ...w, status: 'published' } }).catch(() => 0),
      prisma.notice.count({ where: { ...w, status: 'active' } }).catch(() => 0),
      prisma.faculty.count({ where: { ...w, status: 'published' } }).catch(() => 0),
      prisma.admissionLead.count({ where: w }).catch(() => 0),
      prisma.formSubmission.count({ where: w }).catch(() => 0),
    ]);
    const users = await prisma.userBranch.count({ where: { branchId: branch.id } });
    return { ...branch, stats: { pages, programs, notices, faculty, admissions, forms, users } };
  }));

  return NextResponse.json({ ok: true, comparison });
}
