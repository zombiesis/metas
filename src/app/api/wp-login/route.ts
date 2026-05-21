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
      out[name] = value.length > 500 ? `${value.slice(0, 500)}…` : value;
    }
  }
  return out;
}

function safeBodySnapshot(body: unknown): unknown {
  if (!body || typeof body !== 'object') return null;
  const json = JSON.stringify(body);
  return json.length > 2000 ? `${json.slice(0, 2000)}…` : body;
}

/**
 * Adaptive honeypot stall. Audit-#2 N21: previously every probe held the
 * connection open for 2 s. With Node's default ~1 K connection cap, a
 * coordinated attacker probing all six honeypot URLs becomes a self-DoS
 * vector against the legitimate site.
 *
 * The fix: track recent hits per source IP and shrink the stall window when
 * we detect a flood. Honest one-off probes still get the maximum slowdown;
 * an attacker hitting hundreds of times a minute gets a near-instant 403 so
 * we don't keep their connections camped.
 */
const recentHits = new Map<string, { count: number; reset: number }>();
const HONEYPOT_FLOOD_THRESHOLD = 30; // hits per minute per IP
function pickStallMs(ip: string): number {
  const now = Date.now();
  const entry = recentHits.get(ip);
  if (!entry || entry.reset < now) {
    recentHits.set(ip, { count: 1, reset: now + 60_000 });
    return 2000; // first hit in a window — full slowdown
  }
  entry.count++;
  if (entry.count > HONEYPOT_FLOOD_THRESHOLD) return 0;
  if (entry.count > HONEYPOT_FLOOD_THRESHOLD / 2) return 200;
  return 2000;
}

/** Honeypot endpoint — anyone hitting this is probing. Log + slow them. */
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

  const stall = pickStallMs(ip);
  if (stall > 0) await new Promise((r) => setTimeout(r, stall));
  return NextResponse.json(
    { status: 'error', message: 'Invalid CSRF token. Session expired.', code: 'CSRF_MISMATCH' },
    { status: 403 },
  );
}

export async function GET(request: NextRequest) {
  return POST(request);
}
