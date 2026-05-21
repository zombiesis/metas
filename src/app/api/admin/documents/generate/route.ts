import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { renderTemplate } from '@/lib/email-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOCUMENT_TEMPLATES: Record<string, { name: string; html: string }> = {
  admission_letter: {
    name: 'Admission Letter',
    html: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;border:2px solid #071B33">
<div style="text-align:center;border-bottom:2px solid #C7A45B;padding-bottom:16px;margin-bottom:24px">
<h1 style="color:#071B33;margin:0">Metas Adventist College</h1>
<p style="margin:4px 0;color:#666">Athwalines, Surat, Gujarat</p>
</div>
<p style="text-align:right">Date: {{date}}</p>
<p>Ref: MAC/ADM/{{year}}/{{id}}</p>
<h2 style="text-align:center;color:#071B33">PROVISIONAL ADMISSION LETTER</h2>
<p>Dear <strong>{{studentName}}</strong>,</p>
<p>We are pleased to inform you that your application for admission to the <strong>{{program}}</strong> program has been provisionally accepted for the academic year {{year}}.</p>
<p>Please complete the following formalities within 15 days:</p>
<ol><li>Submit original documents for verification</li><li>Pay the admission fee</li><li>Complete the enrollment form</li></ol>
<p>Congratulations and welcome to the Metas family!</p>
<br><p>Yours sincerely,</p><p><strong>Principal</strong><br>Metas Adventist College</p>
</div>`,
  },
  id_card: {
    name: 'Student ID Card',
    html: `<div style="width:340px;height:210px;border:2px solid #071B33;border-radius:8px;padding:16px;font-family:sans-serif;font-size:12px;position:relative">
<div style="background:#071B33;color:#fff;padding:8px;margin:-16px -16px 12px;border-radius:6px 6px 0 0;text-align:center"><strong>METAS ADVENTIST COLLEGE</strong></div>
<div style="display:flex;gap:12px">
<div style="width:60px;height:72px;background:#eee;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:10px">Photo</div>
<div><p style="margin:2px 0"><strong>{{studentName}}</strong></p><p style="margin:2px 0">Program: {{program}}</p><p style="margin:2px 0">Phone: {{phone}}</p><p style="margin:2px 0">ID: {{id}}</p><p style="margin:2px 0">Valid: {{year}}</p></div>
</div>
</div>`,
  },
  bonafide: {
    name: 'Bonafide Certificate',
    html: `<div style="font-family:serif;max-width:700px;margin:0 auto;padding:40px;border:1px solid #333">
<h2 style="text-align:center">BONAFIDE CERTIFICATE</h2>
<p>This is to certify that <strong>{{studentName}}</strong> is a bonafide student of <strong>{{program}}</strong> program at Metas Adventist College, Surat for the academic year {{year}}.</p>
<p>This certificate is issued on request for the purpose of {{purpose}}.</p>
<br><br><p style="text-align:right"><strong>Principal</strong><br>Metas Adventist College</p>
<p style="font-size:11px;color:#666">Date: {{date}} | Ref: MAC/BON/{{year}}/{{id}}</p>
</div>`,
  },
};

/** GET: list available document templates */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  return NextResponse.json({ ok: true, templates: Object.entries(DOCUMENT_TEMPLATES).map(([id, t]) => ({ id, name: t.name })) });
}

/** POST: generate a document from template + lead data */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'export')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { templateId, leadId, extraVars } = await request.json();
  const template = DOCUMENT_TEMPLATES[templateId];
  if (!template) return NextResponse.json({ ok: false, error: 'Template not found' }, { status: 404 });

  const lead = leadId ? await prisma.admissionLead.findUnique({ where: { id: leadId } }) : null;
  const vars: Record<string, string> = {
    studentName: lead?.studentName || extraVars?.studentName || 'Student Name',
    program: lead?.program || extraVars?.program || 'Program',
    phone: lead?.phone || extraVars?.phone || '',
    email: lead?.email || extraVars?.email || '',
    id: lead?.id?.slice(-6).toUpperCase() || '000000',
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    purpose: extraVars?.purpose || 'official purposes',
    ...extraVars,
  };

  const html = renderTemplate(template.html, vars);
  return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${template.name}</title><style>@media print{body{margin:0}}</style></head><body>${html}</body></html>`, { headers: { 'Content-Type': 'text/html' } });
}
