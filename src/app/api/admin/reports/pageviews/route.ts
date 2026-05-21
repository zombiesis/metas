import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'view_analytics')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const days = parseInt(request.nextUrl.searchParams.get('days') || '7');
  const since = new Date(Date.now() - days * 86400000);

  const events = await prisma.analyticsEvent.findMany({
    where: { event: 'page_view', createdAt: { gte: since } },
    select: { path: true },
  });

  // Aggregate page views
  const pageCounts: Record<string, number> = {};
  for (const e of events) {
    const path = e.path || '/';
    pageCounts[path] = (pageCounts[path] || 0) + 1;
  }

  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, views]) => ({ path, views }));

  const totalViews = events.length;
  const uniquePaths = Object.keys(pageCounts).length;

  return NextResponse.json({ ok: true, days, totalViews, uniquePaths, topPages });
}
