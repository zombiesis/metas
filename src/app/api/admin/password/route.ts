import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdminApi, hashPassword, validatePasswordStrength } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { logSecurityEvent } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ ok: false, error: 'Current and new password required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.session!.userId } });
  if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash).catch(() => false);
  if (!valid) {
    await logSecurityEvent({ event: 'password_change_failed', severity: 'warning', summary: `${auth.session!.username} failed password change (wrong current password)`, userId: user.id, request });
    return NextResponse.json({ ok: false, error: 'Current password is incorrect' }, { status: 403 });
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.ok) {
    return NextResponse.json({ ok: false, error: 'Weak password', fields: Object.fromEntries(strength.errors.map((e, i) => [String(i), e])) }, { status: 422 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  // Revoke all other sessions for security (keep current)
  await prisma.session.deleteMany({ where: { userId: user.id, id: { not: auth.session!.sessionId } } });
  await auditLog({ action: 'password_changed', entityType: 'User', entityId: user.id, summary: `${auth.session!.username} changed password`, userId: user.id, request });
  await logSecurityEvent({ event: 'password_changed', severity: 'info', summary: `${auth.session!.username} changed password`, userId: user.id, request });

  return NextResponse.json({ ok: true });
}
