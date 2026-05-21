import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { clientIp, logSecurityEvent, logLoginGeoAnomaly, rateLimit } from '@/lib/security';
import { SESSION_COOKIE } from '@/lib/session-constants';

export { SESSION_COOKIE };
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_CONCURRENT_SESSIONS = 3;

// Periodic cleanup of expired sessions (at most once per 10 minutes)
let lastSessionCleanup = 0;
async function cleanupExpiredSessions() {
  const now = Date.now();
  if (now - lastSessionCleanup < 10 * 60 * 1000) return;
  lastSessionCleanup = now;
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => null);
}

type AdminSession = { userId: string; username: string; roleName: string; sessionId: string; exp: number };

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function parseCookieToken(token?: string | null) {
  if (!token || !token.includes('.')) return null;
  const [sessionId, rawToken] = token.split('.');
  if (!sessionId || !rawToken) return null;
  return { sessionId, rawToken };
}

/** Fingerprint: hash of IP + first 64 chars of UA (tolerant of minor UA changes) */
function sessionFingerprint(ip: string, ua: string) {
  return sha256(`${ip}:${ua.slice(0, 64)}`).slice(0, 16);
}

// --- Password strength ---
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_RULES = [
  { test: (p: string) => p.length >= PASSWORD_MIN_LENGTH, msg: `At least ${PASSWORD_MIN_LENGTH} characters` },
  { test: (p: string) => /[a-z]/.test(p), msg: 'At least one lowercase letter' },
  { test: (p: string) => /[A-Z]/.test(p), msg: 'At least one uppercase letter' },
  { test: (p: string) => /\d/.test(p), msg: 'At least one number' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), msg: 'At least one special character' },
];

export function validatePasswordStrength(password: string): { ok: boolean; errors: string[] } {
  const errors = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.msg);
  return { ok: errors.length === 0, errors };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyAdminCredentials(username: string, password: string, request?: NextRequest) {
  const limiter = rateLimit(`login:${request ? clientIp(request) : username}`, 8, 15 * 60 * 1000);
  if (!limiter.ok) {
    await logSecurityEvent({ event: 'login_rate_limited', severity: 'warning', summary: `Login throttled for ${username}`, request });
    return null;
  }
  const user = await prisma.user.findUnique({ where: { username }, include: { role: true } }).catch(() => null);
  const now = new Date();
  if (!user || user.status !== 'active') {
    await logSecurityEvent({ event: 'failed_login', severity: 'warning', summary: `Failed login for unknown/inactive user: ${username}`, request });
    return null;
  }
  if (user.lockedUntil && user.lockedUntil > now) {
    await logSecurityEvent({ event: 'locked_login_attempt', severity: 'warning', summary: `Locked account login attempt: ${username}`, userId: user.id, request });
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash).catch(() => false);
  if (!ok) {
    const failedLogins = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins,
        lockedUntil: failedLogins >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : null
      }
    }).catch(() => null);
    await logSecurityEvent({ event: 'failed_login', severity: 'warning', summary: `Failed login for ${username}`, userId: user.id, request });
    return null;
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } }).catch(() => null);
  if (request) await logLoginGeoAnomaly(user.id, clientIp(request), request);
  await auditLog({ action: 'login', entityType: 'User', entityId: user.id, summary: `${username} signed in`, userId: user.id, request });
  await logSecurityEvent({ event: 'login_success', severity: 'info', summary: `${username} signed in`, userId: user.id, request });

  // Send login notification email
  const ip = request ? clientIp(request) : 'unknown';
  const ua = request?.headers.get('user-agent') || 'unknown';
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  if (user.email) {
    const { sendEmail } = await import('@/lib/email');
    sendEmail({
      to: user.email,
      subject: `Login Alert: ${username} signed in`,
      html: `<h3>Login Notification</h3><p>Your account <strong>${username}</strong> was accessed.</p><table><tr><td>Time:</td><td>${time}</td></tr><tr><td>IP:</td><td>${ip}</td></tr><tr><td>Device:</td><td>${ua.slice(0, 100)}</td></tr></table><p>If this wasn't you, change your password immediately and contact the administrator.</p>`,
    }).catch(() => null);
  }

  return user;
}

export async function createAdminSession(userId: string, request?: NextRequest) {
  const rawToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const ip = request ? clientIp(request) : 'unknown';
  const ua = request?.headers.get('user-agent') || 'unknown';
  const fingerprint = sessionFingerprint(ip, ua);

  // Create + prune in a single transaction so two parallel logins can't each
  // leave the user above MAX_CONCURRENT_SESSIONS or both try to delete the
  // same now-stale row.
  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.session.create({
      data: {
        userId,
        tokenHash: sha256(rawToken),
        expiresAt,
        ipAddress: ip,
        userAgent: ua,
        fingerprint,
      },
    });
    const allSessions = await tx.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (allSessions.length > MAX_CONCURRENT_SESSIONS) {
      const toDelete = allSessions.slice(MAX_CONCURRENT_SESSIONS).map((s) => s.id);
      await tx.session.deleteMany({ where: { id: { in: toDelete }, userId } });
    }
    return created;
  });

  return { cookieValue: `${session.id}.${rawToken}`, expiresAt };
}

export async function verifyAdminSession(token?: string | null): Promise<AdminSession | null> {
  cleanupExpiredSessions().catch(() => null);
  const parsed = parseCookieToken(token);
  if (!parsed) return null;
  const session = await prisma.session.findUnique({ where: { id: parsed.sessionId }, include: { user: { include: { role: true } } } }).catch(() => null);
  if (!session || session.expiresAt < new Date() || session.user.status !== 'active') return null;
  if (!safeEqual(session.tokenHash, sha256(parsed.rawToken))) return null;

  // Session fingerprint validation
  if (session.fingerprint) {
    let reqHeaders: any = null;
    try { reqHeaders = await headers(); } catch {}
    if (reqHeaders) {
      const ip = reqHeaders.get('cf-connecting-ip') || reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || reqHeaders.get('x-real-ip') || 'unknown';
      const ua = reqHeaders.get('user-agent') || 'unknown';
      const currentFp = sessionFingerprint(ip, ua);
      if (currentFp !== session.fingerprint) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
        await logSecurityEvent({ event: 'session_fingerprint_mismatch', severity: 'critical', summary: `Session hijack attempt for ${session.user.username}`, userId: session.user.id });
        return null;
      }
    }
  }

  // Idle timeout
  const lastActivity = session.lastActiveAt ?? session.createdAt;
  if (Date.now() - lastActivity.getTime() > SESSION_IDLE_TIMEOUT_MS) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  // Touch session
  await prisma.session.update({ where: { id: session.id }, data: { lastActiveAt: new Date() } }).catch(() => null);
  return { userId: session.user.id, username: session.user.username, roleName: session.user.role?.name || 'Viewer', sessionId: session.id, exp: session.expiresAt.getTime() };
}

export async function getAdminSession() {
  const store = await cookies();
  return verifyAdminSession(store.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) return { response: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }), session: null };
  return { response: null, session };
}

export async function setSessionCookie(response: NextResponse, userId: string, request?: NextRequest) {
  const { cookieValue } = await createAdminSession(userId, request);
  response.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export async function clearSessionCookie(response: NextResponse) {
  const store = await cookies();
  const parsed = parseCookieToken(store.get(SESSION_COOKIE)?.value);
  if (parsed) await prisma.session.delete({ where: { id: parsed.sessionId } }).catch(() => null);
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}

/** Revoke all sessions for a user, or a specific session (ownership-checked). */
export async function revokeSessions(userId: string, sessionId?: string) {
  if (sessionId) {
    // Use deleteMany so the userId filter is actually enforced. With prisma.delete()
    // only unique fields (id) are honoured and the userId guard is silently ignored —
    // letting any caller with a sessionId revoke another user's session.
    await prisma.session.deleteMany({ where: { id: sessionId, userId } });
  } else {
    await prisma.session.deleteMany({ where: { userId } });
  }
}

/** Returns a 403 response if the user hasn't enabled 2FA — used to gate sensitive actions */
export async function require2faForSensitive(userId: string): Promise<NextResponse | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpEnabled: true } });
  if (!user?.totpEnabled) {
    return NextResponse.json({ ok: false, error: '2FA must be enabled to perform this action. Enable it in Security settings.' }, { status: 403 });
  }
  return null;
}
