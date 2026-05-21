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
// Single env name for the AWS region across the codebase (audit-#2 N22).
// Falls back to AWS_REGION (legacy) for older deployments, then to ap-south-1.
const AWS_REGION = process.env.AWS_REGION || process.env.S3_REGION || 'ap-south-1';

/**
 * Send an email using the configured provider.
 *
 * Audit-#2 N5: the previous SES provider used unsigned HTTP (always 403'd) and
 * the SMTP provider was a stub that returned `true` without sending anything.
 * Both are now backed by proper SDKs (`@aws-sdk/client-ses`, `nodemailer`).
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const from = msg.from || process.env.EMAIL_FROM || 'noreply@metasofsda.in';
  try {
    switch (PROVIDER) {
      case 'sendgrid':
        return await sendViaSendGrid({ ...msg, from });
      case 'ses':
        return await sendViaSES({ ...msg, from });
      case 'smtp':
        return await sendViaSMTP({ ...msg, from });
      default:
        logger.info({ to: msg.to, subject: msg.subject }, 'Email (console mode)');
        return true;
    }
  } catch (err) {
    logger.error({ err, to: msg.to, subject: msg.subject, provider: PROVIDER }, 'Email send failed');
    return false;
  }
}

async function sendViaSendGrid(msg: EmailMessage & { from: string }): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.error('SENDGRID_API_KEY is not set');
    return false;
  }
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to }] }],
      from: { email: msg.from },
      reply_to: msg.replyTo ? { email: msg.replyTo } : undefined,
      subject: msg.subject,
      content: [
        ...(msg.text ? [{ type: 'text/plain', value: msg.text }] : []),
        { type: 'text/html', value: msg.html },
      ],
    }),
  });
  if (!res.ok) {
    logger.error({ status: res.status, body: await res.text().catch(() => '') }, 'SendGrid rejected message');
  }
  return res.ok;
}

/** Module-scoped client cache so we don't build a fresh SES/SMTP transport per request. */
let sesClient: import('@aws-sdk/client-ses').SESClient | null = null;
async function getSesClient() {
  if (sesClient) return sesClient;
  const { SESClient } = await import('@aws-sdk/client-ses');
  sesClient = new SESClient({
    region: AWS_REGION,
    // Credentials default to the AWS SDK provider chain (env, profile, EC2,
    // ECS, etc.) — only override if the caller has explicitly set them.
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
  return sesClient;
}

async function sendViaSES(msg: EmailMessage & { from: string }): Promise<boolean> {
  const { SendEmailCommand } = await import('@aws-sdk/client-ses');
  const client = await getSesClient();
  const cmd = new SendEmailCommand({
    Source: msg.from,
    Destination: { ToAddresses: [msg.to] },
    ReplyToAddresses: msg.replyTo ? [msg.replyTo] : undefined,
    Message: {
      Subject: { Data: msg.subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: msg.html, Charset: 'UTF-8' },
        ...(msg.text ? { Text: { Data: msg.text, Charset: 'UTF-8' } } : {}),
      },
    },
  });
  const response = await client.send(cmd);
  return Boolean(response.MessageId);
}

let smtpTransporter: import('nodemailer').Transporter | null = null;
async function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;
  const nodemailer = (await import('nodemailer')).default;
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    // Implicit TLS only on port 465; everything else uses STARTTLS via the
    // `requireTLS` flag so we never silently downgrade to plaintext.
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    requireTLS: Number(process.env.SMTP_PORT || 587) !== 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });
  return smtpTransporter;
}

async function sendViaSMTP(msg: EmailMessage & { from: string }): Promise<boolean> {
  if (!process.env.SMTP_HOST) {
    logger.error('SMTP_HOST is not set — refusing to silently swallow the message');
    return false;
  }
  const transporter = await getSmtpTransporter();
  const result = await transporter.sendMail({
    from: msg.from,
    to: msg.to,
    replyTo: msg.replyTo,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  });
  return Boolean(result.accepted?.length);
}

/** Send email to multiple recipients (sequential — keeps SES/SendGrid happy on burst limits). */
export async function sendBulkEmail(messages: EmailMessage[]): Promise<number> {
  let sent = 0;
  for (const msg of messages) {
    if (await sendEmail(msg)) sent++;
  }
  return sent;
}
