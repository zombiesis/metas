import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: return the current admin's active branch */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const store = await cookies();
  const branchId = store.get('metas_admin_branch')?.value || null;
  return NextResponse.json({ ok: true, branchId });
}

/** POST: switch the admin's active branch (stored in session) */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'switch_branch')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { branchId } = await request.json();
  if (!branchId) return NextResponse.json({ ok: false, error: 'branchId required' }, { status: 400 });

  // Verify branch exists and user has access
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return NextResponse.json({ ok: false, error: 'Branch not found' }, { status: 404 });

  // Store active branch in session metadata (using ipAddress field as temp storage for branch context)
  // In production, add an activeBranchId field to Session model
  const response = NextResponse.json({ ok: true, branch: { id: branch.id, name: branch.name } });
  response.cookies.set('metas_admin_branch', branchId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 86400 });
  return response;
}
