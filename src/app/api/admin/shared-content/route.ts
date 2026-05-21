import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Shared content = records with branchId = NULL.
 * These appear on ALL branches (university-wide notices, policies, etc.)
 */

/** GET: list shared notices (branchId is null) */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const notices = await prisma.notice.findMany({
    where: { branchId: null, deletedAt: null },
    orderBy: [{ pinned: 'desc' }, { date: 'desc' }],
    take: 100,
  });
  return NextResponse.json({ ok: true, notices });
}

/** POST: create a shared notice (visible to all branches) */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Only Super Admin can create shared content' }, { status: 403 });
  }

  const { title, category, body, pinned, date } = await request.json();
  if (!title) return NextResponse.json({ ok: false, error: 'Title required' }, { status: 400 });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-shared';
  const notice = await prisma.notice.create({
    data: {
      branchId: null, // shared across all branches
      title,
      slug,
      category: category || 'University',
      body: body || null,
      pinned: Boolean(pinned),
      date: date ? new Date(date) : new Date(),
      status: 'active',
      createdBy: auth.session!.username,
      updatedBy: auth.session!.username,
    },
  });
  return NextResponse.json({ ok: true, notice });
}
