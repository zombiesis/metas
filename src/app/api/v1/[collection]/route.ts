import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { readCMSCollection } from '@/lib/cms-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ collection: string }> };

async function validateApiKey(request: NextRequest): Promise<{ branchId: string | null; scopes: string[] } | null> {
  const authHeader = request.headers.get('authorization');
  const key = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.nextUrl.searchParams.get('api_key');
  if (!key) return null;

  const keyHash = createHash('sha256').update(key).digest('hex');
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update last used
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => null);
  return { branchId: apiKey.branchId, scopes: apiKey.scopes.split(',').map(s => s.trim()) };
}

const ALLOWED_COLLECTIONS = ['programs', 'notices', 'documents', 'faculty', 'events', 'blogs', 'careers'];

/** GET /api/v1/[collection] — public REST API with API key auth */
export async function GET(request: NextRequest, context: Context) {
  const auth = await validateApiKey(request);
  if (!auth) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  if (!auth.scopes.includes('read')) return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 });

  const { collection } = await context.params;
  if (!ALLOWED_COLLECTIONS.includes(collection)) return NextResponse.json({ error: 'Collection not available via API' }, { status: 404 });

  const data = await readCMSCollection(collection as any);
  return NextResponse.json({ ok: true, collection, data, count: Array.isArray(data) ? data.length : 0 });
}
