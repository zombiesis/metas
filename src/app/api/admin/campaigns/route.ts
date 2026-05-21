import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';
import { sendEmail } from '@/lib/email';
import { renderTemplate, getTemplateVars, wrapInLayout } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: list campaigns */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const branchId = await getCurrentBranchId();
  const campaigns = await prisma.dripCampaign.findMany({ where: branchId ? { branchId } : {}, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ ok: true, campaigns: campaigns.map(c => ({ ...c, steps: JSON.parse(c.steps), audience: JSON.parse(c.audience) })) });
}

/** POST: create campaign or enroll leads */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'create')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { action, ...data } = await request.json();

  if (action === 'create') {
    const branchId = await getCurrentBranchId();
    const campaign = await prisma.dripCampaign.create({ data: { branchId, name: data.name, steps: JSON.stringify(data.steps || []), audience: JSON.stringify(data.audience || {}), createdBy: auth.session!.username } });
    return NextResponse.json({ ok: true, campaign });
  }

  if (action === 'enroll') {
    const { campaignId, leadIds } = data;
    if (!campaignId || !leadIds?.length) return NextResponse.json({ ok: false, error: 'campaignId and leadIds required' }, { status: 400 });
    const campaign = await prisma.dripCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 });
    const steps = JSON.parse(campaign.steps);
    const firstDelay = steps[0]?.delayHours || 0;

    let enrolled = 0;
    for (const leadId of leadIds) {
      await prisma.campaignEnrollment.create({ data: { campaignId, leadId, nextRunAt: new Date(Date.now() + firstDelay * 3600000) } }).catch(() => null);
      enrolled++;
    }
    await prisma.dripCampaign.update({ where: { id: campaignId }, data: { enrolledCount: { increment: enrolled }, status: 'active' } });
    return NextResponse.json({ ok: true, enrolled });
  }

  if (action === 'activate') {
    await prisma.dripCampaign.update({ where: { id: data.id }, data: { status: 'active' } });
    return NextResponse.json({ ok: true });
  }

  if (action === 'pause') {
    await prisma.dripCampaign.update({ where: { id: data.id }, data: { status: 'paused' } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}

/** Process drip campaign steps — call via cron every 15 minutes */
export async function processDripCampaigns() {
  const now = new Date();
  const due = await prisma.campaignEnrollment.findMany({ where: { status: 'active', nextRunAt: { lte: now } }, take: 100 });

  for (const enrollment of due) {
    const campaign = await prisma.dripCampaign.findUnique({ where: { id: enrollment.campaignId } });
    if (!campaign || campaign.status !== 'active') continue;

    const steps = JSON.parse(campaign.steps);
    const step = steps[enrollment.currentStep];
    if (!step) {
      await prisma.campaignEnrollment.update({ where: { id: enrollment.id }, data: { status: 'completed', completedAt: now } });
      continue;
    }

    const lead = await prisma.admissionLead.findUnique({ where: { id: enrollment.leadId } });
    if (!lead) continue;

    // Execute step
    if (step.type === 'email' && lead.email) {
      const vars = await getTemplateVars({ name: lead.studentName, email: lead.email, phone: lead.phone, program: lead.program || '' });
      await sendEmail({ to: lead.email, subject: renderTemplate(step.subject || 'Update', vars), html: wrapInLayout(renderTemplate(step.body || '', vars)) }).catch(() => null);
    }

    // Advance to next step
    const nextStep = enrollment.currentStep + 1;
    const nextDelay = steps[nextStep]?.delayHours || 0;
    if (nextStep >= steps.length) {
      await prisma.campaignEnrollment.update({ where: { id: enrollment.id }, data: { status: 'completed', completedAt: now } });
    } else {
      await prisma.campaignEnrollment.update({ where: { id: enrollment.id }, data: { currentStep: nextStep, nextRunAt: new Date(now.getTime() + nextDelay * 3600000) } });
    }
  }
  return due.length;
}
