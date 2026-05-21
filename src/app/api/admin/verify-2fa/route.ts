import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { setSessionCookie } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { verifyTotp } from '@/lib/totp';
import { decrypt } from '@/lib/crypto';
import { auditLog } from '@/lib/audit';
import { logSecurityEvent, rateLimit } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PENDING_2FA_COOKIE = 'metas_2fa_pending';

function parsePendingToken(cookie: string | undefined): { userId: string } | null {
  if (!cookie) return null;
  const parts = cookie.split(':');
  if (parts.length !== 4) return null;
  const [userId, expiresStr, nonce, sig] = parts;
  const payload = `${userId}:${expiresStr}:${nonce}`;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
  if (Date.now() > Number(expiresStr)) return null;
  return { userId };
}

export async function POST(request: NextRequest) {
  const pending = parsePendingToken(request.cookies.get(PENDING_2FA_COOKIE)?.value);
  if (!pending) {
    return NextResponse.redirect(new URL('/admin/login?error=2fa_expired', request.url), { status: 303 });
  }

  // Rate limit: 5 attempts per pending session (keyed by userId)
  const limiter = rateLimit(`2fa:${pending.userId}`, 5, 5 * 60 * 1000);
  if (!limiter.ok) {
    // Auto-lock account for 30 minutes on repeated 2FA failures
    await prisma.user.update({ where: { id: pending.userId }, data: { lockedUntil: new Date(Date.now() + 30 * 60 * 1000) } }).catch(() => null);
    await logSecurityEvent({ event: '2fa_rate_limited', severity: 'critical', summary: `2FA attempts exhausted — account auto-locked`, userId: pending.userId, request });
    const response = NextResponse.redirect(new URL('/admin/login?error=2fa_locked', request.url), { status: 303 });
    response.cookies.set(PENDING_2FA_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
    return response;
  }

  const form = await request.formData();
  const token = String(form.get('token') || '').trim();

  const user = await prisma.user.findUnique({ where: { id: pending.userId } });
  if (!user || !user.totpSecret || !user.totpEnabled) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url), { status: 303 });
  }

  // Try TOTP first (with replay protection)
  const decryptedSecret = decrypt(user.totpSecret);
  const totpResult = verifyTotp(decryptedSecret, token, user.lastTotpCounter);
  let valid = totpResult.valid;

  // Store counter to prevent replay
  if (totpResult.valid && totpResult.counter != null) {
    await prisma.user.update({ where: { id: user.id }, data: { lastTotpCounter: totpResult.counter } }).catch(() => null);
  }

  // If TOTP fails, try recovery code
  if (!valid && user.recoveryCodes) {
    const codes: string[] = JSON.parse(user.recoveryCodes);
    const normalized = token.toUpperCase().replace(/\s/g, '');
    const idx = codes.indexOf(normalized);
    if (idx !== -1) {
      valid = true;
      codes.splice(idx, 1);
      await prisma.user.update({ where: { id: user.id }, data: { recoveryCodes: JSON.stringify(codes) } });
      await logSecurityEvent({ event: 'recovery_code_used', severity: 'warning', summary: `${user.username} used a recovery code (${codes.length} remaining)`, userId: user.id, request });
    }
  }

  if (!valid) {
    await logSecurityEvent({ event: 'failed_2fa', severity: 'warning', summary: `Failed 2FA for ${user.username}`, userId: user.id, request });
    return NextResponse.redirect(new URL('/admin/login/verify-2fa?error=1', request.url), { status: 303 });
  }

  await auditLog({ action: '2fa_verified', entityType: 'User', entityId: user.id, summary: `${user.username} passed 2FA`, userId: user.id, request });

  const response = NextResponse.redirect(new URL('/admin/dashboard', request.url), { status: 303 });
  response.cookies.set(PENDING_2FA_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
  await setSessionCookie(response, user.id, request);
  return response;
}
