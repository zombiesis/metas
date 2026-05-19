import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getAdminSession } from '@/lib/admin-auth';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (session) await auditLog({ action: 'logout', entityType: 'User', entityId: session.userId, summary: `${session.username} signed out`, userId: session.userId, request });
  const response = NextResponse.redirect(new URL('/admin/login', request.url), { status: 303 });
  await clearSessionCookie(response);
  return response;
}
