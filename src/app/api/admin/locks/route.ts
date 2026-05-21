import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory lock store: key = "collection:id", value = { user, lockedAt, expiresAt }
const locks = new Map<string, { user: string; userId: string; lockedAt: number; expiresAt: number }>();
const LOCK_TTL = 5 * 60 * 1000; // 5 minutes

function cleanExpired() {
  const now = Date.now();
  for (const [k, v] of locks) if (v.expiresAt < now) locks.delete(k);
}

/** GET: check lock status for a record */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  cleanExpired();

  const collection = request.nextUrl.searchParams.get('collection');
  const id = request.nextUrl.searchParams.get('id');
  if (!collection || !id) return NextResponse.json({ ok: false, error: 'collection and id required' }, { status: 400 });

  const key = `${collection}:${id}`;
  const lock = locks.get(key);
  if (!lock) return NextResponse.json({ ok: true, locked: false });
  if (lock.userId === auth.session!.userId) return NextResponse.json({ ok: true, locked: true, ownLock: true, user: lock.user });
  return NextResponse.json({ ok: true, locked: true, ownLock: false, user: lock.user, lockedAt: lock.lockedAt });
}

/** POST: acquire or renew a lock */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  cleanExpired();

  const { collection, id } = await request.json();
  if (!collection || !id) return NextResponse.json({ ok: false, error: 'collection and id required' }, { status: 400 });

  const key = `${collection}:${id}`;
  const existing = locks.get(key);

  // If locked by another user, reject
  if (existing && existing.userId !== auth.session!.userId && existing.expiresAt > Date.now()) {
    return NextResponse.json({ ok: false, error: `Locked by ${existing.user}`, lockedBy: existing.user }, { status: 409 });
  }

  // Acquire or renew
  locks.set(key, { user: auth.session!.username, userId: auth.session!.userId, lockedAt: Date.now(), expiresAt: Date.now() + LOCK_TTL });
  return NextResponse.json({ ok: true, expiresIn: LOCK_TTL });
}

/** DELETE: release a lock */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { collection, id } = await request.json();
  const key = `${collection}:${id}`;
  const lock = locks.get(key);
  if (lock && lock.userId === auth.session!.userId) locks.delete(key);
  return NextResponse.json({ ok: true });
}
