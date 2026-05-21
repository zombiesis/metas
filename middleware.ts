import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'metas_admin_session';
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/login/verify-2fa', '/api/admin/login', '/api/admin/verify-2fa'];

// --- DDoS Protection: Global rate limiting ---
// Per-IP: 200 requests/minute globally, 60/minute for admin API
const globalBuckets = new Map<string, { count: number; reset: number }>();
const GLOBAL_RATE_LIMIT = 200;
const GLOBAL_RATE_WINDOW = 60_000;

const apiBuckets = new Map<string, { count: number; reset: number }>();
const API_RATE_LIMIT = 60;
const API_RATE_WINDOW = 60_000;

// --- DDoS Protection: Auto-ban IPs that exceed burst threshold ---
const bannedIps = new Map<string, number>(); // ip -> ban expiry timestamp
const BAN_THRESHOLD = 500; // requests in window to trigger ban
const BAN_DURATION = 10 * 60_000; // 10 minute ban

// Periodic cleanup (prevent memory leak)
let lastCleanup = Date.now();
function cleanupBuckets() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [k, v] of globalBuckets) if (v.reset < now) globalBuckets.delete(k);
  for (const [k, v] of apiBuckets) if (v.reset < now) apiBuckets.delete(k);
  for (const [k, v] of bannedIps) if (v < now) bannedIps.delete(k);
  // Hard cap to prevent memory exhaustion under DDoS
  if (globalBuckets.size > 100000) globalBuckets.clear();
  if (apiBuckets.size > 50000) apiBuckets.clear();
}

function checkGlobalRate(ip: string): boolean {
  cleanupBuckets();
  const now = Date.now();

  // Check ban
  const banExpiry = bannedIps.get(ip);
  if (banExpiry && banExpiry > now) return false;

  const bucket = globalBuckets.get(ip);
  if (!bucket || bucket.reset < now) {
    globalBuckets.set(ip, { count: 1, reset: now + GLOBAL_RATE_WINDOW });
    return true;
  }
  bucket.count++;

  // Auto-ban on burst
  if (bucket.count > BAN_THRESHOLD) {
    bannedIps.set(ip, now + BAN_DURATION);
    return false;
  }

  return bucket.count <= GLOBAL_RATE_LIMIT;
}

function checkApiRate(ip: string): { ok: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const bucket = apiBuckets.get(ip);
  if (!bucket || bucket.reset < now) {
    apiBuckets.set(ip, { count: 1, reset: now + API_RATE_WINDOW });
    return { ok: true, remaining: API_RATE_LIMIT - 1, reset: now + API_RATE_WINDOW };
  }
  bucket.count++;
  return { ok: bucket.count <= API_RATE_LIMIT, remaining: Math.max(0, API_RATE_LIMIT - bucket.count), reset: bucket.reset };
}

function getIp(request: NextRequest): string {
  if (process.env.TRUST_PROXY === 'cloudflare') {
    return request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function isPublicAdminPath(pathname: string) {
  return PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname === p + '/');
}

function originCheck(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIp(request);
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isStudent = pathname.startsWith('/student') || pathname.startsWith('/api/student');

  // Block source map requests in production
  if (pathname.endsWith('.map')) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Block direct access to internal API structure discovery
  if (pathname === '/api' || pathname === '/api/') {
    return new NextResponse('Not found', { status: 404 });
  }

  // DDoS: Global rate limit on ALL requests (blocks abusive IPs site-wide)
  if (!checkGlobalRate(ip)) {
    return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60', 'Content-Type': 'text/plain' } });
  }

  // Stricter rate limit on admin API endpoints
  let apiRateInfo: { remaining: number; reset: number } | null = null;
  if (pathname.startsWith('/api/admin')) {
    const rl = checkApiRate(ip);
    apiRateInfo = { remaining: rl.remaining, reset: rl.reset };
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(Math.ceil(rl.reset / 1000)) } });
    }
  }

  // Per-tenant rate limit on public form submissions
  if (pathname.startsWith('/api/forms')) {
    const host = request.headers.get('host')?.split(':')[0] || 'default';
    const tenantKey = `tenant:${host}:${ip}`;
    const bucket = globalBuckets.get(tenantKey);
    const now = Date.now();
    if (!bucket || bucket.reset < now) {
      globalBuckets.set(tenantKey, { count: 1, reset: now + 60_000 });
    } else {
      bucket.count++;
      if (bucket.count > 30) {
        return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } });
      }
    }
  }

  // CSRF: reject cross-origin state-changing requests to admin API (before auth)
  if (pathname.startsWith('/api/admin') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (!originCheck(request)) {
      return NextResponse.json({ ok: false, error: 'CSRF origin mismatch' }, { status: 403 });
    }
  }

  // Auth guard: block unauthenticated access to protected admin routes
  if (isAdmin && !isPublicAdminPath(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token || !token.includes('.')) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Tenant resolution: set branch host header for server-side domain resolution
  const host = request.headers.get('host')?.split(':')[0] || 'localhost';
  response.headers.set('x-branch-host', host);
  // Branch ID resolved server-side via resolveBranchByDomain(host) in tenant.ts
  // Do NOT trust client cookies for branch selection

  // Request ID for tracing
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  response.headers.set('X-Request-Id', requestId);

  // Security headers — CSP with nonce for inline scripts
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://docs.google.com"
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  if (isAdmin) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  } else if (isStudent) {
    // Student routes: maximum security headers
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  } else if (pathname.startsWith('/uploads/') || pathname.startsWith('/assets/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (!pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
  if (apiRateInfo) {
    response.headers.set('X-RateLimit-Remaining', String(apiRateInfo.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(apiRateInfo.reset / 1000)));
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
