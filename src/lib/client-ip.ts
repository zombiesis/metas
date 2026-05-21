import type { NextRequest } from 'next/server';

/**
 * Single source of truth for resolving the client IP used by:
 *   • rate limiting (admin login, public forms, global DDoS bucket)
 *   • audit logs / SecurityEvent.ipAddress
 *   • IP-binding session fingerprints
 *
 * The previous behaviour returned `'0.0.0.0'` whenever `TRUST_PROXY` was unset
 * — collapsing every request in the world into a single bucket. That made
 * login lockouts and form throttles trivially DoS-able and turned audit logs
 * into garbage.
 *
 * Behaviour now:
 *   - TRUST_PROXY=cloudflare → trust `cf-connecting-ip`
 *   - TRUST_PROXY=nginx      → trust `x-real-ip`
 *   - TRUST_PROXY=<any>      → trust the first hop in `x-forwarded-for`
 *   - unset, NODE_ENV=production → fallback IP, but log a one-time warning
 *   - unset, NODE_ENV=development|test → best-effort sniff of XFF / x-real-ip
 */
const FALLBACK_IP = '0.0.0.0';
let warnedAboutMissingTrustProxy = false;

function firstHop(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(',')[0]?.trim();
  return first && first.length ? first : null;
}

export function clientIp(request: NextRequest | { headers: Headers }): string {
  const headers = request.headers;
  const trustProxy = process.env.TRUST_PROXY;

  if (trustProxy === 'cloudflare') {
    return headers.get('cf-connecting-ip') || FALLBACK_IP;
  }
  if (trustProxy === 'nginx') {
    return headers.get('x-real-ip') || FALLBACK_IP;
  }
  if (trustProxy) {
    return firstHop(headers.get('x-forwarded-for')) || FALLBACK_IP;
  }

  if (process.env.NODE_ENV === 'production') {
    if (!warnedAboutMissingTrustProxy) {
      warnedAboutMissingTrustProxy = true;
      // eslint-disable-next-line no-console
      console.error(
        '[security] TRUST_PROXY is not set in production. Rate limits and audit IPs will collapse to a shared bucket. Set TRUST_PROXY=cloudflare (or =nginx).',
      );
    }
    return FALLBACK_IP;
  }

  // Development / tests: best-effort sniff so per-IP buckets behave sensibly
  // when running behind a local proxy or curl with explicit headers.
  return (
    firstHop(headers.get('x-forwarded-for')) ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    FALLBACK_IP
  );
}

export const FALLBACK_CLIENT_IP = FALLBACK_IP;
