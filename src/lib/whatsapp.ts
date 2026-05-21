import { logger } from '@/lib/logger';

const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_API = 'https://graph.facebook.com/v18.0';

export const whatsappEnabled = Boolean(WA_TOKEN && WA_PHONE_ID);

/** Send a WhatsApp template message */
export async function sendWhatsAppTemplate(to: string, templateName: string, vars: string[]): Promise<boolean> {
  if (!whatsappEnabled) { logger.info({ to, templateName }, 'WhatsApp (disabled — set WHATSAPP_TOKEN)'); return false; }

  const phone = to.replace(/[^0-9]/g, '');
  const res = await fetch(`${WA_API}/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.startsWith('91') ? phone : `91${phone}`,
      type: 'template',
      template: { name: templateName, language: { code: 'en' }, components: [{ type: 'body', parameters: vars.map(v => ({ type: 'text', text: v })) }] },
    }),
  });
  if (!res.ok) logger.error({ status: res.status, to: phone }, 'WhatsApp send failed');
  return res.ok;
}

/** Send a plain text WhatsApp message (requires 24h window) */
export async function sendWhatsAppText(to: string, message: string): Promise<boolean> {
  if (!whatsappEnabled) { logger.info({ to, message: message.slice(0, 50) }, 'WhatsApp text (disabled)'); return false; }

  const phone = to.replace(/[^0-9]/g, '');
  const res = await fetch(`${WA_API}/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.startsWith('91') ? phone : `91${phone}`,
      type: 'text',
      text: { body: message },
    }),
  });
  return res.ok;
}

/** Send admission confirmation via WhatsApp */
export async function sendAdmissionWhatsApp(phone: string, studentName: string, program: string): Promise<boolean> {
  return sendWhatsAppTemplate(phone, 'admission_confirmation', [studentName, program]);
}

/** Webhook handler for incoming WhatsApp messages */
export function parseWhatsAppWebhook(body: any): { from: string; message: string; name?: string } | null {
  try {
    const entry = body?.entry?.[0]?.changes?.[0]?.value;
    if (!entry?.messages?.[0]) return null;
    const msg = entry.messages[0];
    const contact = entry.contacts?.[0];
    return { from: msg.from, message: msg.text?.body || '', name: contact?.profile?.name };
  } catch { return null; }
}
