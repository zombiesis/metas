import { logger } from '@/lib/logger';

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
};

export type EmailProvider = 'sendgrid' | 'ses' | 'smtp' | 'console';

const PROVIDER: EmailProvider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'console';

/** Send an email using the configured provider */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const from = msg.from || process.env.EMAIL_FROM || 'noreply@metasofsda.in';
  try {
    switch (PROVIDER) {
      case 'sendgrid': return await sendViaSendGrid({ ...msg, from });
      case 'ses': return await sendViaSES({ ...msg, from });
      case 'smtp': return await sendViaSMTP({ ...msg, from });
      default: logger.info({ to: msg.to, subject: msg.subject }, 'Email (console mode)'); return true;
    }
  } catch (err) {
    logger.error({ err, to: msg.to, subject: msg.subject }, 'Email send failed');
    return false;
  }
}

async function sendViaSendGrid(msg: EmailMessage & { from: string }): Promise<boolean> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to }] }],
      from: { email: msg.from },
      reply_to: msg.replyTo ? { email: msg.replyTo } : undefined,
      subject: msg.subject,
      content: [{ type: 'text/html', value: msg.html }],
    }),
  });
  return res.ok;
}

async function sendViaSES(msg: EmailMessage & { from: string }): Promise<boolean> {
  const params = new URLSearchParams({
    Action: 'SendEmail',
    'Destination.ToAddresses.member.1': msg.to,
    'Message.Subject.Data': msg.subject,
    'Message.Body.Html.Data': msg.html,
    Source: msg.from,
    Version: '2010-12-01',
  });
  const region = process.env.AWS_REGION || 'ap-south-1';
  const res = await fetch(`https://email.${region}.amazonaws.com/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return res.ok;
}

async function sendViaSMTP(msg: EmailMessage & { from: string }): Promise<boolean> {
  // Minimal SMTP via raw TCP — for production use nodemailer
  logger.info({ to: msg.to, subject: msg.subject, provider: 'smtp' }, 'SMTP send (stub — install nodemailer for production)');
  return true;
}

/** Send email to multiple recipients */
export async function sendBulkEmail(messages: EmailMessage[]): Promise<number> {
  let sent = 0;
  for (const msg of messages) {
    if (await sendEmail(msg)) sent++;
  }
  return sent;
}
