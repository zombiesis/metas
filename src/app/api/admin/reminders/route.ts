import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate, renderTemplate, getTemplateVars, wrapInLayout } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reminders
 * Processes follow-up reminders for leads with followUpAt <= now.
 * Call via cron alongside /api/admin/scheduler.
 */
export async function GET(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || request.headers.get('x-api-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const dueLeads = await prisma.admissionLead.findMany({
    where: { followUpAt: { lte: now }, status: { in: ['new', 'contacted'] } },
    take: 50,
  });

  let sent = 0;
  const notifEmail = process.env.FORMS_NOTIFICATION_EMAIL;

  for (const lead of dueLeads) {
    if (notifEmail) {
      const tpl = await getEmailTemplate('follow_up_reminder');
      const vars = await getTemplateVars({ studentName: lead.studentName, phone: lead.phone, program: lead.program || 'Not specified', status: lead.status });
      await sendEmail({ to: notifEmail, subject: renderTemplate(tpl.subject, vars), html: wrapInLayout(renderTemplate(tpl.body, vars)) });
      sent++;
    }

    // Push followUpAt forward by 3 days to avoid re-sending
    await prisma.admissionLead.update({
      where: { id: lead.id },
      data: { followUpAt: new Date(now.getTime() + 3 * 86400000) },
    });
  }

  return NextResponse.json({ ok: true, processed: dueLeads.length, emailsSent: sent, timestamp: now.toISOString() });
}
