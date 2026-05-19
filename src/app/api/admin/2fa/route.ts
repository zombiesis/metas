import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { generateTotpSecret, getTotpUri, verifyTotp, generateRecoveryCodes } from '@/lib/totp';
import { encrypt } from '@/lib/crypto';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: generate a new TOTP secret + QR code data URL */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const secret = generateTotpSecret();
  const uri = getTotpUri(secret, auth.session!.username);
  const qrDataUrl = await QRCode.toDataURL(uri, { width: 256, margin: 2 });
  return NextResponse.json({ ok: true, secret, uri, qrDataUrl });
}

/** POST: confirm 2FA setup with a valid token, or disable 2FA */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const { action, secret, token } = await request.json();

  if (action === 'disable') {
    await prisma.user.update({ where: { id: auth.session!.userId }, data: { totpEnabled: false, totpSecret: null, recoveryCodes: null } });
    await auditLog({ action: '2fa_disabled', entityType: 'User', entityId: auth.session!.userId, summary: `${auth.session!.username} disabled 2FA`, userId: auth.session!.userId, request });
    return NextResponse.json({ ok: true });
  }

  if (!secret || !token) return NextResponse.json({ ok: false, error: 'Secret and token required' }, { status: 400 });
  if (!verifyTotp(secret, token)) return NextResponse.json({ ok: false, error: 'Invalid token. Try again.' }, { status: 400 });

  const codes = generateRecoveryCodes();
  await prisma.user.update({ where: { id: auth.session!.userId }, data: { totpSecret: encrypt(secret), totpEnabled: true, recoveryCodes: JSON.stringify(codes) } });
  await auditLog({ action: '2fa_enabled', entityType: 'User', entityId: auth.session!.userId, summary: `${auth.session!.username} enabled 2FA`, userId: auth.session!.userId, request });
  return NextResponse.json({ ok: true, recoveryCodes: codes });
}
