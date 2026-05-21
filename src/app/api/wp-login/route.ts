import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Honeypot endpoint — looks like a real login/admin endpoint.
 * Anyone hitting this is probing. Log them and return fake response.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
  const ua = request.headers.get('user-agent') || '';
  const body = await request.json().catch(() => ({}));

  // Log the intrusion attempt
  await prisma.securityEvent.create({
    data: {
      event: 'honeypot_triggered',
      severity: 'critical',
      summary: `Honeypot hit: ${request.nextUrl.pathname}`,
      ipAddress: ip,
      userAgent: ua,
      metadata: JSON.stringify({ path: request.nextUrl.pathname, body, headers: Object.fromEntries(request.headers) }),
    },
  }).catch(() => null);

  // Return fake "almost worked" response to waste their time
  await new Promise(r => setTimeout(r, 2000)); // Slow response
  return NextResponse.json({ status: 'error', message: 'Invalid CSRF token. Session expired.', code: 'CSRF_MISMATCH' }, { status: 403 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
