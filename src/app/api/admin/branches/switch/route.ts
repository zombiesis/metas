import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { BRANCH_COOKIE, signBranchCookie, verifyBranchCookie } from '@/lib/branch-cookie';
import { logSecurityEvent } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: return the current admin's active branch (only if cookie is valid for THIS user) */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const store = await cookies();
  const verified = verifyBranchCookie(store.get(BRANCH_COOKIE)?.value);
  const branchId = verified && verified.userId === auth.session!.userId ? verified.branchId : null;
  return NextResponse.json({ ok: true, branchId });
}

/** POST: switch the admin's active branch (HMAC-signed cookie, gated on UserBranch access). */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!(await can(auth.session!.roleName, 'switch_branch'))) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { branchId?: unknown } | null;
  const branchId = typeof body?.branchId === 'string' ? body.branchId : '';
  if (!branchId) return NextResponse.json({ ok: false, error: 'branchId required' }, { status: 400 });

  const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, name: true, status: true } });
  if (!branch || branch.status !== 'active') {
    return NextResponse.json({ ok: false, error: 'Branch not found' }, { status: 404 });
  }

  // Super Admins can act on any branch; everyone else must have an explicit
  // UserBranch row. This closes the multi-tenant bypass where any admin could
  // switch into any branch by setting the (previously unsigned) cookie value.
  if (auth.session!.roleName !== 'Super Admin') {
    const access = await prisma.userBranch.findUnique({
      where: { userId_branchId: { userId: auth.session!.userId, branchId } },
      select: { id: true },
    }).catch(() => null);
    if (!access) {
      await logSecurityEvent({
        event: 'branch_switch_denied',
        severity: 'warning',
        summary: `${auth.session!.username} attempted to switch into branch ${branchId} without access`,
        userId: auth.session!.userId,
        request,
      });
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
  }

  const signed = signBranchCookie(auth.session!.userId, branchId);
  const response = NextResponse.json({ ok: true, branch: { id: branch.id, name: branch.name } });
  response.cookies.set(BRANCH_COOKIE, signed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/', // FIX: was '/admin' — admin API lives under /api/admin and never received the cookie
    maxAge: 86400,
  });
  return response;
}
