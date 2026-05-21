import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: list versions for a page, or compare two versions */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const pageId = request.nextUrl.searchParams.get('pageId');
  const v1 = request.nextUrl.searchParams.get('v1');
  const v2 = request.nextUrl.searchParams.get('v2');

  if (!pageId) return NextResponse.json({ ok: false, error: 'pageId required' }, { status: 400 });

  // List all versions
  if (!v1) {
    const versions = await prisma.pageVersion.findMany({ where: { pageId }, orderBy: { version: 'desc' }, select: { id: true, version: true, createdBy: true, createdAt: true } });
    return NextResponse.json({ ok: true, versions });
  }

  // Compare two versions
  const version1 = await prisma.pageVersion.findFirst({ where: { pageId, version: parseInt(v1) } });
  const version2 = v2
    ? await prisma.pageVersion.findFirst({ where: { pageId, version: parseInt(v2) } })
    : { snapshot: JSON.stringify(await prisma.page.findUnique({ where: { id: pageId } })), version: 'current' };

  if (!version1) return NextResponse.json({ ok: false, error: 'Version not found' }, { status: 404 });

  const snap1 = JSON.parse(version1.snapshot);
  const snap2 = JSON.parse(version2!.snapshot);

  // Compute field-level diff
  const allKeys = new Set([...Object.keys(snap1), ...Object.keys(snap2)]);
  const changes: Array<{ field: string; old: unknown; new: unknown }> = [];
  for (const key of allKeys) {
    if (JSON.stringify(snap1[key]) !== JSON.stringify(snap2[key])) {
      changes.push({ field: key, old: snap1[key], new: snap2[key] });
    }
  }

  return NextResponse.json({ ok: true, v1: version1.version, v2: version2!.version, changes });
}
