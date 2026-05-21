import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Forensic-only headers we are willing to persist in the security event log.
 *
 * Anything not on this list — `cookie`, `authorization`, `cf-connecting-ip`,
 * `x-forwarded-for`, etc. — would leak credentials/PII of legitimate users
 * who happen to follow a poisoned link or mistype a URL. Don't add to this
 * list without thinking through that case.
 */
const SAFE_HEADERS = new Set([
  'user-agent',
  'referer',
  'host',
  'accept',
  'accept-language',
  'content-type',
  'content-length',
]);

function safeHeaderSnapshot(request: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of request.headers) {
    if (SAFE_HEADERS.has(name.toLowerCase())) {
      // Truncate to keep one bad request from blowing up the row size.
      out[name] = value.length > 500 ? `${value.slice(0, 500)}…` : value;
    }
  }
  return out;
}

function safeBodySnapshot(body: unknown): unknown {
  if (!body || typeof body !== 'object') return null;
  const json = JSON.stringify(body);
  // Cap to ~2 KB so attackers can't fill the audit table with junk.
  return json.length > 2000 ? `${json.slice(0, 2000)}…` : body;
}

/**
 * Honeypot endpoint — looks like a real login/admin endpoint.
 * Anyone hitting this is probing. Log them and return a fake error.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const ua = request.headers.get('user-agent') || '';
  const body = await request.json().catch(() => ({}));

  await prisma.securityEvent.create({
    data: {
      event: 'honeypot_triggered',
      severity: 'critical',
      summary: `Honeypot hit: ${request.nextUrl.pathname}`,
      ipAddress: ip,
      userAgent: ua,
      metadata: JSON.stringify({
        path: request.nextUrl.pathname,
        method: request.method,
        body: safeBodySnapshot(body),
        headers: safeHeaderSnapshot(request),
      }),
    },
  }).catch(() => null);

  // Slow response to waste the prober's time.
  await new Promise((r) => setTimeout(r, 2000));
  return NextResponse.json(
    { status: 'error', message: 'Invalid CSRF token. Session expired.', code: 'CSRF_MISMATCH' },
    { status: 403 },
  );
}

export async function GET(request: NextRequest) {
  return POST(request);
}
