import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi, revokeSessions } from '@/lib/admin-auth';
import { auditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: list active sessions for current user */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const sessions = await prisma.session.findMany({
    where: { userId: auth.session!.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, ipAddress: true, userAgent: true, createdAt: true, lastActiveAt: true, expiresAt: true }
  });
  return NextResponse.json({ ok: true, sessions });
}

/** DELETE: revoke sessions. Body: { sessionId?: string } — omit to kill all */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const { sessionId } = await request.json().catch(() => ({ sessionId: undefined }));

  // Don't let user kill their own current session via this endpoint
  if (sessionId === auth.session!.sessionId) {
    return NextResponse.json({ ok: false, error: 'Use logout to end current session' }, { status: 400 });
  }

  await revokeSessions(auth.session!.userId, sessionId);
  await auditLog({
    action: sessionId ? 'session_revoked' : 'all_sessions_revoked',
    entityType: 'Session',
    entityId: sessionId || auth.session!.userId,
    summary: sessionId ? 'Revoked a specific session' : 'Revoked all other sessions',
    userId: auth.session!.userId,
    request
  });
  return NextResponse.json({ ok: true });
}
