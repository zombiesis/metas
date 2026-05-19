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
      event: safeString(data.event || 'event'),
      path: safeString(data.path || ''),
      label: safeString(data.label || ''),
      value: safeString(data.value || ''),
      metadata: JSON.stringify(data.metadata || {}),
      sessionId: safeString(data.sessionId || ''),
      ipAddress: clientIp(request),
      userAgent: request.headers.get('user-agent') || undefined
    }
  }).catch(() => null);
  return NextResponse.json({ ok: true });
}
