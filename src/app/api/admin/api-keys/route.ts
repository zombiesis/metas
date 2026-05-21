import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: list API keys for current branch */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const branchId = await getCurrentBranchId();
  const keys = await prisma.apiKey.findMany({ where: branchId ? { branchId } : {}, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, prefix: true, scopes: true, expiresAt: true, lastUsedAt: true, createdAt: true } });
  return NextResponse.json({ ok: true, keys });
}

/** POST: create a new API key */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_security')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { name, scopes, expiresInDays } = await request.json();
  if (!name) return NextResponse.json({ ok: false, error: 'Name required' }, { status: 400 });

  const rawKey = `metas_${randomBytes(24).toString('base64url')}`;
  const prefix = rawKey.slice(0, 12);
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const branchId = await getCurrentBranchId();

  await prisma.apiKey.create({
    data: { name, keyHash, prefix, branchId, userId: auth.session!.userId, scopes: scopes || 'read', expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null },
  });

  // Return the raw key ONCE — it cannot be retrieved again
  return NextResponse.json({ ok: true, key: rawKey, prefix, message: 'Save this key — it will not be shown again.' });
}

/** DELETE: revoke an API key (branch-scoped — audit-#2 N4) */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_security')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
  const branchId = await getCurrentBranchId();
  // deleteMany so the (id, branchId) AND clause is actually enforced — prisma.delete()
  // would silently drop the branchId guard since only `id` is unique. Super Admins
  // outside a branch context (no `metas_admin_branch`) still see/delete all keys.
  const filter: Record<string, unknown> = { id };
  if (branchId) filter.branchId = branchId;
  const result = await prisma.apiKey.deleteMany({ where: filter as any });
  if (result.count === 0) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
