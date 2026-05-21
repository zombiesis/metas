import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { can } from '@/lib/rbac';
import { invalidateDomainCache } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: list all branches */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' },
    include: { domains: true, settings: true, _count: { select: { users: true } } },
  });
  return NextResponse.json({ ok: true, branches });
}

/** POST: create a new branch */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const { name, slug, domain } = await request.json();
  if (!name || !slug) return NextResponse.json({ ok: false, error: 'Name and slug required' }, { status: 400 });

  const branch = await prisma.branch.create({
    data: {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      settings: { create: {} },
      ...(domain ? { domains: { create: { domain, isPrimary: true } } } : {}),
    },
    include: { domains: true, settings: true },
  });

  // Assign current user to new branch
  await prisma.userBranch.create({ data: { userId: auth.session!.userId, branchId: branch.id } }).catch(() => null);

  await auditLog({ action: 'created_branch', entityType: 'Branch', entityId: branch.id, summary: `Created branch: ${name}`, userId: auth.session!.userId, request });
  return NextResponse.json({ ok: true, branch });
}

/** PUT: update branch */
export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const { id, name, slug, status, domains, settings } = await request.json();
  if (!id) return NextResponse.json({ ok: false, error: 'Branch ID required' }, { status: 400 });

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(slug ? { slug: slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-') } : {}),
      ...(status ? { status } : {}),
    },
  });

  // Update settings if provided
  if (settings) {
    await prisma.branchSettings.upsert({
      where: { branchId: id },
      create: { branchId: id, ...settings },
      update: settings,
    });
  }

  // Update domains if provided
  if (Array.isArray(domains)) {
    await prisma.branchDomain.deleteMany({ where: { branchId: id } });
    for (const d of domains) {
      await prisma.branchDomain.create({ data: { branchId: id, domain: d.domain, isPrimary: Boolean(d.isPrimary) } });
    }
    invalidateDomainCache();
  }

  await auditLog({ action: 'updated_branch', entityType: 'Branch', entityId: id, summary: `Updated branch: ${branch.name}`, userId: auth.session!.userId, request });
  return NextResponse.json({ ok: true, branch });
}

/** DELETE: delete a branch */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await request.json();
  if (!id) return NextResponse.json({ ok: false, error: 'Branch ID required' }, { status: 400 });

  // Safety check: prevent deletion if branch has content
  const contentCount = await prisma.page.count({ where: { branchId: id } });
  if (contentCount > 0) {
    return NextResponse.json({ ok: false, error: `Cannot delete branch with ${contentCount} page(s). Remove or reassign content first.` }, { status: 400 });
  }

  await prisma.userBranch.deleteMany({ where: { branchId: id } });
  await prisma.branch.delete({ where: { id } });
  invalidateDomainCache();

  await auditLog({ action: 'deleted_branch', entityType: 'Branch', entityId: id, summary: 'Deleted branch', userId: auth.session!.userId, request });
  return NextResponse.json({ ok: true });
}
