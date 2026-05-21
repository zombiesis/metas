import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Health check — requires admin auth to prevent info disclosure */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const start = Date.now();
  let dbOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {}

  const branches = await prisma.branch.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, slug: true, domains: { select: { domain: true } } },
  }).catch(() => []);

  return NextResponse.json({
    status: dbOk ? 'healthy' : 'degraded',
    db: dbOk,
    latencyMs: Date.now() - start,
    branches: branches.map(b => ({ name: b.name, slug: b.slug, domains: b.domains.map(d => d.domain) })),
    timestamp: new Date().toISOString(),
  }, { status: dbOk ? 200 : 503 });
}
