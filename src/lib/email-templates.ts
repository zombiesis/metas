import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { getBranchTheme } from '@/lib/theme';

export type TemplateVars = Record<string, string>;

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  admission_confirmation: {
    subject: 'Thank you for your inquiry, {{name}}!',
    body: `<h2>Hello {{name}},</h2>
<p>Thank you for your admission inquiry for the <strong>{{program}}</strong> program.</p>
<p>Our admissions team will contact you within 24-48 hours at {{phone}}.</p>
<p>If you have questions, reply to this email or call our admissions office.</p>
<p>Best regards,<br>{{branchName}} Admissions Team</p>`,
  },
  contact_reply: {
    subject: 'We received your message — {{branchName}}',
    body: `<h2>Hello {{name}},</h2>
<p>Thank you for reaching out. We've received your {{inquiryType}} inquiry and will respond shortly.</p>
<p>Best regards,<br>{{branchName}}</p>`,
  },
  form_notification: {
    subject: '[{{branchName}}] New {{kind}} submission from {{name}}',
    body: `<h2>New {{kind}} submission</h2>
<p><strong>Name:</strong> {{name}}</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Phone:</strong> {{phone}}</p>
<p><strong>Program:</strong> {{program}}</p>
<p><strong>Message:</strong> {{message}}</p>
<p><a href="{{adminUrl}}">View in admin panel →</a></p>`,
  },
  follow_up_reminder: {
    subject: 'Follow up: {{studentName}} — {{program}}',
    body: `<h2>Follow-up Reminder</h2>
<p>Lead <strong>{{studentName}}</strong> ({{phone}}) is due for follow-up.</p>
<p><strong>Program:</strong> {{program}}</p>
<p><strong>Status:</strong> {{status}}</p>
<p><a href="{{adminUrl}}">Open in admin →</a></p>`,
  },
};

/** Render a template with variables */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

/** Get a template for the current branch (falls back to defaults) */
export async function getEmailTemplate(templateKey: string): Promise<{ subject: string; body: string }> {
  const branchId = await getCurrentBranchId();

  // Check for branch-specific override in SiteSetting
  if (branchId) {
    const setting = await prisma.siteSetting.findFirst({ where: { key: `email_template_${templateKey}`, branchId } }).catch(() => null);
    if (setting) {
      try { return JSON.parse(setting.value); } catch {}
    }
  }

  return DEFAULT_TEMPLATES[templateKey] || { subject: 'Notification', body: '<p>{{message}}</p>' };
}

/** Build common template variables from branch context */
export async function getTemplateVars(extra: TemplateVars = {}): Promise<TemplateVars> {
  const theme = await getBranchTheme();
  return {
    branchName: theme.tagline ? theme.tagline.split('—')[0]?.trim() || 'Metas Adventist College' : 'Metas Adventist College',
    adminUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    ...extra,
  };
}

/** Wrap email body in a branded HTML layout */
export function wrapInLayout(body: string, primaryColor = '#071B33'): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Inter,sans-serif;margin:0;padding:0;background:#f5f5f5">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
<div style="background:${primaryColor};padding:24px 32px;color:#fff"><h1 style="margin:0;font-size:20px">Metas Adventist College</h1></div>
<div style="padding:32px">${body}</div>
<div style="padding:16px 32px;background:#f9f9f9;font-size:12px;color:#666;text-align:center">This is an automated message. Please do not reply directly.</div>
</div></body></html>`;
}
