import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/scheduler
 * Publishes content where publishAt <= now and status is 'draft' or 'review'.
 * Call this via cron (every minute) or on-demand.
 * Secured by INTERNAL_API_SECRET header.
 */
export async function GET(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || request.headers.get('x-api-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, number> = {};

  // Pages
  const pages = await prisma.page.updateMany({ where: { publishAt: { lte: now }, status: { in: ['draft', 'review'] } }, data: { status: 'published' } });
  if (pages.count) results.pages = pages.count;

  // Notices
  const notices = await prisma.notice.updateMany({ where: { publishAt: { lte: now }, status: { in: ['draft'] } }, data: { status: 'active' } });
  if (notices.count) results.notices = notices.count;

  // Expire notices past expiryDate
  const expired = await prisma.notice.updateMany({ where: { expiryDate: { lte: now }, status: 'active' }, data: { status: 'expired' } });
  if (expired.count) results.expired_notices = expired.count;

  return NextResponse.json({ ok: true, published: results, timestamp: now.toISOString() });
}
