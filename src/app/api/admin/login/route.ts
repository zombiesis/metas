import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'node:crypto';
import { setSessionCookie, verifyAdminCredentials } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PENDING_2FA_COOKIE = 'metas_2fa_pending';
const PENDING_2FA_MAX_AGE = 5 * 60; // 5 minutes

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  const user = await verifyAdminCredentials(username, password, request);
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url), { status: 303 });
  }

  // If 2FA is enabled, redirect to verification page with a pending token
  if (user.totpEnabled && user.totpSecret) {
    const response = NextResponse.redirect(new URL('/admin/login/verify-2fa', request.url), { status: 303 });
    const nonce = randomBytes(16).toString('hex');
    const expires = Date.now() + PENDING_2FA_MAX_AGE * 1000;
    const payload = `${user.id}:${expires}:${nonce}`;
    const secret = process.env.SESSION_SECRET;
    if (!secret) return NextResponse.redirect(new URL('/admin/login?error=config', request.url), { status: 303 });
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    response.cookies.set(PENDING_2FA_COOKIE, `${payload}:${sig}`, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: PENDING_2FA_MAX_AGE
    });
    return response;
  }

  const response = NextResponse.redirect(new URL('/admin/dashboard', request.url), { status: 303 });
  await setSessionCookie(response, user.id, request);
  return response;
}
