import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ collection: string }> };

type ApiKeyAuth = { id: string; branchId: string | null; scopes: string[] };

async function validateApiKey(request: NextRequest): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get('authorization');
  const key = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.nextUrl.searchParams.get('api_key');
  if (!key) return null;

  const keyHash = createHash('sha256').update(key).digest('hex');
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update last used (best-effort, never blocks the response)
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => null);
  return { id: apiKey.id, branchId: apiKey.branchId, scopes: apiKey.scopes.split(',').map((s) => s.trim()) };
}

const ALLOWED_COLLECTIONS = ['programs', 'notices', 'documents', 'faculty', 'events', 'blogs', 'careers'] as const;
type AllowedCollection = (typeof ALLOWED_COLLECTIONS)[number];

/**
 * Per-collection branch-scoped fetcher. We deliberately bypass `readCMSCollection`
 * here because that helper resolves the branch from the request **host**, which
 * would let an API key issued for branch A read branch B's data simply by
 * sending the request to branch B's domain (audit-#2 N2).
 *
 * The API key's `branchId` is the only authority we trust here. A key with a
 * null `branchId` is a "cross-tenant" key (Super Admin only — created by
 * `/api/admin/api-keys`) and is allowed to see all branches; everyone else is
 * pinned to their `branchId`.
 */
async function readBranchScoped(collection: AllowedCollection, branchId: string | null) {
  const branchFilter = branchId ? { branchId } : {};
  switch (collection) {
    case 'programs':
      return prisma.program.findMany({ where: { ...branchFilter, deletedAt: null, status: 'published' }, orderBy: [{ category: 'asc' }, { title: 'asc' }] });
    case 'notices':
      return prisma.notice.findMany({ where: { ...branchFilter, deletedAt: null, status: 'active' }, orderBy: [{ pinned: 'desc' }, { date: 'desc' }] });
    case 'documents':
      return prisma.document.findMany({ where: { ...branchFilter, status: 'current', visibility: 'public' }, orderBy: { updatedAt: 'desc' } });
    case 'faculty':
      return prisma.faculty.findMany({ where: { ...branchFilter, status: 'published' }, orderBy: { name: 'asc' } });
    case 'events':
      return prisma.event.findMany({ where: { ...branchFilter, status: 'published' }, orderBy: { startDate: 'desc' } });
    case 'blogs':
      return prisma.blogPost.findMany({ where: { ...branchFilter, status: 'published' }, orderBy: { publishedAt: 'desc' } });
    case 'careers':
      return prisma.jobOpening.findMany({ where: { ...branchFilter, status: 'published' }, orderBy: { createdAt: 'desc' } });
  }
}

/** GET /api/v1/[collection] — public REST API with API-key-bound branch */
export async function GET(request: NextRequest, context: Context) {
  const auth = await validateApiKey(request);
  if (!auth) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  if (!auth.scopes.includes('read')) return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 });

  const { collection } = await context.params;
  if (!ALLOWED_COLLECTIONS.includes(collection as AllowedCollection)) {
    return NextResponse.json({ error: 'Collection not available via API' }, { status: 404 });
  }

  const data = await readBranchScoped(collection as AllowedCollection, auth.branchId);
  return NextResponse.json({ ok: true, collection, branchId: auth.branchId, data, count: data.length });
}
