import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import { notifyWebhook, WEBHOOK_EVENTS } from '@/lib/webhooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['review'],
  review: ['published', 'draft'],
  published: ['archived', 'draft'],
  archived: ['draft'],
};

const MODEL_MAP: Record<string, any> = {
  pages: 'page',
  programs: 'program',
  notices: 'notice',
  events: 'event',
  blogs: 'blogPost',
  careers: 'jobOpening',
};

/** POST: transition content status */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { collection, id, action } = await request.json();
  if (!collection || !id || !action) return NextResponse.json({ ok: false, error: 'collection, id, and action required' }, { status: 400 });

  const modelName = MODEL_MAP[collection];
  if (!modelName) return NextResponse.json({ ok: false, error: `Workflow not supported for ${collection}` }, { status: 400 });

  // Check permission based on action
  if (action === 'published' && !await can(auth.session!.roleName, 'publish')) {
    return NextResponse.json({ ok: false, error: 'Publish permission required' }, { status: 403 });
  }

  const model = (prisma as any)[modelName];
  const record = await model.findUnique({ where: { id }, select: { status: true, title: true } });
  if (!record) return NextResponse.json({ ok: false, error: 'Record not found' }, { status: 404 });

  const allowed = VALID_TRANSITIONS[record.status];
  if (!allowed || !allowed.includes(action)) {
    return NextResponse.json({ ok: false, error: `Cannot transition from '${record.status}' to '${action}'` }, { status: 400 });
  }

  await model.update({ where: { id }, data: { status: action, updatedBy: auth.session!.username } });

  await auditLog({ action: `status_${action}`, entityType: collection, entityId: id, summary: `${record.title || id}: ${record.status} → ${action}`, userId: auth.session!.userId, request });

  if (action === 'published') {
    notifyWebhook(WEBHOOK_EVENTS.CONTENT_PUBLISHED, { collection, id, title: record.title });
  }

  return NextResponse.json({ ok: true, previousStatus: record.status, newStatus: action });
}
