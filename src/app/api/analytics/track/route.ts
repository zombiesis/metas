import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, rateLimit } from '@/lib/security';
import { safeString } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const limiter = rateLimit(`analytics:${clientIp(request)}`, 120, 60 * 1000);
  if (!limiter.ok) return NextResponse.json({ ok: false }, { status: 200 });
  const data = await request.json().catch(() => ({}));
  await prisma.analyticsEvent.create({
    data: {
      event: safeString(data.event || 'event').slice(0, 100),
      path: safeString(data.path || '').slice(0, 500),
      label: safeString(data.label || '').slice(0, 200),
      value: safeString(data.value || '').slice(0, 200),
      metadata: JSON.stringify(data.metadata || {}).slice(0, 2000),
      sessionId: safeString(data.sessionId || '').slice(0, 100),
      ipAddress: clientIp(request),
      userAgent: request.headers.get('user-agent')?.slice(0, 500) || undefined
    }
  }).catch(() => null);
  return NextResponse.json({ ok: true });
}
