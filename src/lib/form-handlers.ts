import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tenantCreateData } from '@/lib/prisma-tenant';
import { clientIp, jsonBlocked, rateLimit } from '@/lib/security';
import { safeString } from '@/lib/utils';
import { notifyWebhook, WEBHOOK_EVENTS } from '@/lib/webhooks';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate, renderTemplate, getTemplateVars, wrapInLayout } from '@/lib/email-templates';
import { calculateSpamScore, isSpam } from '@/lib/spam-scoring';
import { executeWorkflows } from '@/lib/workflow-engine';

async function payloadFromRequest(request: NextRequest) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json();
  return Object.fromEntries((await request.formData()).entries());
}

function wantsJson(request: NextRequest) {
  return request.headers.get('accept')?.includes('application/json') || request.headers.get('content-type')?.includes('application/json');
}

function success(request: NextRequest, message: string) {
  if (wantsJson(request)) return NextResponse.json({ ok: true, message });
  const ref = request.headers.get('referer') || '/';
  try {
    const url = new URL(ref);
    const host = request.headers.get('host')?.split(':')[0];
    if (url.hostname !== host) return NextResponse.redirect(new URL('/?submitted=1', request.url), { status: 303 });
    url.searchParams.set('submitted', '1');
    return NextResponse.redirect(url, { status: 303 });
  } catch { return NextResponse.redirect(new URL('/?submitted=1', request.url), { status: 303 }); }
}

function fail(request: NextRequest, message: string, status = 400) {
  if (wantsJson(request)) return NextResponse.json({ ok: false, error: message }, { status });
  const ref = request.headers.get('referer') || '/';
  try {
    const url = new URL(ref);
    const host = request.headers.get('host')?.split(':')[0];
    if (url.hostname !== host) return NextResponse.redirect(new URL('/?error=' + encodeURIComponent(message), request.url), { status: 303 });
    url.searchParams.set('error', message);
    return NextResponse.redirect(url, { status: 303 });
  } catch { return NextResponse.redirect(new URL('/?error=' + encodeURIComponent(message), request.url), { status: 303 }); }
}

async function recordAnalytics(event: string, request: NextRequest, data: Record<string, unknown>) {
  await prisma.analyticsEvent.create({
    data: {
      event,
      path: safeString(data.sourcePage || request.headers.get('referer') || ''),
      label: safeString(data.program || data.inquiryType || data.kind || ''),
      metadata: JSON.stringify(data),
      ipAddress: clientIp(request),
      userAgent: request.headers.get('user-agent') || undefined
    }
  }).catch(() => null);
}

export async function handlePublicForm(kind: 'admissions' | 'contact' | 'recruiter' | 'alumni' | 'career' | 'newsletter', request: NextRequest) {
  const limiter = rateLimit(`form:${kind}:${clientIp(request)}`, 20, 15 * 60 * 1000);
  if (!limiter.ok) return jsonBlocked('Too many form submissions. Please try again later.');
  const data = await payloadFromRequest(request);
  if (data.website) return success(request, 'Thank you.');
  if (!data.consent && kind !== 'newsletter') return fail(request, 'Consent is required.');

  // Spam scoring
  const spamResult = calculateSpamScore(data, Date.now() - (Number(data._startTime) || Date.now() - 30000));
  if (isSpam(spamResult.score)) return success(request, 'Thank you.'); // silently reject spam

  const sourcePage = safeString(data.sourcePage || request.headers.get('referer') || '');
  const utmSource = safeString(data.utmSource || data.utm_source || '');
  const branch = await tenantCreateData();
  const submissionCommon = {
    ...branch,
    ipAddress: clientIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
    sourcePage,
    utmSource,
    consent: Boolean(data.consent)
  };
  const leadCommon = { ...branch, sourcePage, utmSource, consent: Boolean(data.consent) };

  if (kind === 'admissions') {
    const phone = safeString(data.phone);
    const studentName = safeString(data.studentName || data.name);
    if (!phone || !studentName) return fail(request, 'Student name and phone are required.');
    const duplicate = await prisma.admissionLead.findFirst({ where: { OR: [{ phone }, ...(safeString(data.email) ? [{ email: safeString(data.email) }] : [])] }, orderBy: { createdAt: 'desc' } });
    await prisma.admissionLead.create({ data: { studentName, parentName: safeString(data.parentName), phone, whatsapp: safeString(data.whatsapp), email: safeString(data.email), city: safeString(data.city), program: safeString(data.program), qualification: safeString(data.qualification), message: safeString(data.message), duplicateOf: duplicate?.id, ...leadCommon } });
    await prisma.formSubmission.create({ data: { kind, name: studentName, phone, email: safeString(data.email), program: safeString(data.program), message: safeString(data.message), data: JSON.stringify(data), ...submissionCommon } });
    await recordAnalytics('form_submit_admissions', request, data);
    notifyWebhook(WEBHOOK_EVENTS.ADMISSION_LEAD, { kind, name: studentName, email: safeString(data.email), phone }, branch.branchId);
    // Trigger workflows
    executeWorkflows('admission_created', { studentName, phone, email: safeString(data.email), program: safeString(data.program), ...data }, branch.branchId).catch(() => null);
    // Auto-reply email to applicant
    const applicantEmail = safeString(data.email);
    if (applicantEmail) {
      const tpl = await getEmailTemplate('admission_confirmation');
      const vars = await getTemplateVars({ name: studentName, phone, program: safeString(data.program), email: applicantEmail });
      await sendEmail({ to: applicantEmail, subject: renderTemplate(tpl.subject, vars), html: wrapInLayout(renderTemplate(tpl.body, vars)) }).catch(() => null);
    }
    // Notify admin
    const notifEmail = process.env.FORMS_NOTIFICATION_EMAIL;
    if (notifEmail) {
      const tpl = await getEmailTemplate('form_notification');
      const vars = await getTemplateVars({ kind, name: studentName, email: safeString(data.email), phone, program: safeString(data.program), message: safeString(data.message) });
      await sendEmail({ to: notifEmail, subject: renderTemplate(tpl.subject, vars), html: wrapInLayout(renderTemplate(tpl.body, vars)) }).catch(() => null);
    }
    return success(request, 'Admission inquiry submitted successfully.');
  }

  if (kind === 'contact') {
    const name = safeString(data.name);
    if (!name) return fail(request, 'Name is required.');
    await prisma.contactInquiry.create({ data: { ...branch, name, phone: safeString(data.phone), email: safeString(data.email), inquiryType: safeString(data.inquiryType || 'General'), message: safeString(data.message), consent: Boolean(data.consent) } });
  } else if (kind === 'recruiter') {
    const company = safeString(data.company);
    if (!company) return fail(request, 'Company is required.');
    await prisma.recruiterInquiry.create({ data: { ...branch, company, contactPerson: safeString(data.contactPerson), designation: safeString(data.designation), phone: safeString(data.phone), email: safeString(data.email), hiringRequirement: safeString(data.hiringRequirement), programInterest: safeString(data.programInterest), message: safeString(data.message), consent: Boolean(data.consent) } });
  } else if (kind === 'alumni') {
    const name = safeString(data.name);
    if (!name) return fail(request, 'Name is required.');
    await prisma.alumniRegistration.create({ data: { ...branch, name, graduationYear: safeString(data.graduationYear), program: safeString(data.program), profession: safeString(data.profession), company: safeString(data.company), phone: safeString(data.phone), email: safeString(data.email), linkedIn: safeString(data.linkedIn || data.linkedin), message: safeString(data.message), consent: Boolean(data.consent) } });
  }

  await prisma.formSubmission.create({ data: { kind, name: safeString(data.name || data.contactPerson || data.company), phone: safeString(data.phone), email: safeString(data.email), program: safeString(data.program || data.programInterest), message: safeString(data.message), data: JSON.stringify(data), ...submissionCommon } });
  await recordAnalytics(`form_submit_${kind}`, request, data);
  notifyWebhook(WEBHOOK_EVENTS.FORM_SUBMITTED, { kind, name: safeString(data.name || data.contactPerson || data.company), email: safeString(data.email) }, branch.branchId);
  executeWorkflows('form_submitted', { kind, ...data }, branch.branchId).catch(() => null);
  return success(request, 'Form submitted successfully.');
}
