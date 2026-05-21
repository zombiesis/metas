import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { renderTemplate, getTemplateVars, wrapInLayout } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/escalation
 * Auto-escalates leads that haven't been contacted within threshold.
 * Call via cron (every hour). Secured by INTERNAL_API_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || request.headers.get('x-api-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const escalationHours = parseInt(process.env.ESCALATION_HOURS || '48');
  const cutoff = new Date(Date.now() - escalationHours * 3600000);
  const managerEmail = process.env.ESCALATION_EMAIL || process.env.FORMS_NOTIFICATION_EMAIL;

  // Find leads that are still 'new' and older than threshold
  const staleLeads = await prisma.admissionLead.findMany({
    where: { status: 'new', createdAt: { lt: cutoff } },
    take: 50,
  });

  let escalated = 0;
  for (const lead of staleLeads) {
    // Mark as escalated
    await prisma.admissionLead.update({ where: { id: lead.id }, data: { status: 'contacted', notes: `[Auto-escalated: uncontacted for ${escalationHours}h]\n${lead.notes || ''}` } });

    // Notify manager
    if (managerEmail) {
      const vars = await getTemplateVars({ studentName: lead.studentName, phone: lead.phone, program: lead.program || 'Not specified', hours: String(escalationHours) });
      await sendEmail({ to: managerEmail, subject: renderTemplate('⚠️ Escalation: {{studentName}} uncontacted for {{hours}}h', vars), html: wrapInLayout(renderTemplate('<h2>Lead Escalation</h2><p><strong>{{studentName}}</strong> ({{phone}}) has not been contacted for {{hours}} hours.</p><p>Program: {{program}}</p><p><a href="{{adminUrl}}/admin/admissions">View in admin →</a></p>', vars)) }).catch(() => null);
    }
    escalated++;
  }

  return NextResponse.json({ ok: true, escalated, threshold: `${escalationHours}h` });
}
