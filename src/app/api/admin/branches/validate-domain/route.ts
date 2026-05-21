import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: validate if a domain is available */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const domain = request.nextUrl.searchParams.get('domain')?.trim().toLowerCase();
  if (!domain) return NextResponse.json({ ok: false, error: 'domain param required' }, { status: 400 });

  // Basic format validation
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(domain)) {
    return NextResponse.json({ ok: true, available: false, reason: 'Invalid domain format' });
  }

  const existing = await prisma.branchDomain.findUnique({ where: { domain }, select: { branchId: true } });
  return NextResponse.json({ ok: true, available: !existing, reason: existing ? 'Domain already assigned' : null });
}
