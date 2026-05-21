import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'view_analytics')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const branchId = await getCurrentBranchId();
  const w = branchId ? { branchId } : {};

  const [inquiries, applications, contacted, enrolled, closed] = await Promise.all([
    prisma.admissionLead.count({ where: w }),
    prisma.admissionLead.count({ where: { ...w, status: { in: ['applied', 'contacted', 'enrolled'] } } }),
    prisma.admissionLead.count({ where: { ...w, status: 'contacted' } }),
    prisma.admissionLead.count({ where: { ...w, status: 'enrolled' } }),
    prisma.admissionLead.count({ where: { ...w, status: 'closed' } }),
  ]);

  const funnel = [
    { stage: 'Inquiries', count: inquiries, pct: 100 },
    { stage: 'Contacted', count: contacted, pct: inquiries ? Math.round((contacted / inquiries) * 100) : 0 },
    { stage: 'Applied', count: applications, pct: inquiries ? Math.round((applications / inquiries) * 100) : 0 },
    { stage: 'Enrolled', count: enrolled, pct: inquiries ? Math.round((enrolled / inquiries) * 100) : 0 },
    { stage: 'Closed/Lost', count: closed, pct: inquiries ? Math.round((closed / inquiries) * 100) : 0 },
  ];

  const conversionRate = inquiries ? ((enrolled / inquiries) * 100).toFixed(1) : '0';

  return NextResponse.json({ ok: true, funnel, conversionRate, total: inquiries });
}
