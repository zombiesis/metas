import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/retention
 * Auto-archives old form submissions and analytics events.
 * Call via cron (daily). Secured by INTERNAL_API_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || request.headers.get('x-api-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '180');
  const cutoff = new Date(Date.now() - retentionDays * 86400000);
  const results: Record<string, number> = {};

  // Archive old form submissions (status → 'archived')
  const forms = await prisma.formSubmission.updateMany({ where: { createdAt: { lt: cutoff }, status: { not: 'archived' } }, data: { status: 'archived' } });
  if (forms.count) results.forms_archived = forms.count;

  // Delete old analytics events (older than retention period)
  const analytics = await prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  if (analytics.count) results.analytics_deleted = analytics.count;

  // Archive old closed admission leads
  const leads = await prisma.admissionLead.updateMany({ where: { createdAt: { lt: cutoff }, status: 'closed' }, data: { status: 'archived' } });
  if (leads.count) results.leads_archived = leads.count;

  // Delete expired sessions
  const sessions = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  if (sessions.count) results.sessions_cleaned = sessions.count;

  return NextResponse.json({ ok: true, retentionDays, cutoff: cutoff.toISOString(), results });
}
