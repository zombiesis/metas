import { logger } from '@/lib/logger';

export type SmsProvider = 'twilio' | 'msg91' | 'console';

const PROVIDER: SmsProvider = (process.env.SMS_PROVIDER as SmsProvider) || 'console';

/** Send an SMS message */
export async function sendSms(to: string, message: string): Promise<boolean> {
  const phone = to.replace(/[^+\d]/g, '');
  if (!phone || phone.length < 10) return false;

  try {
    switch (PROVIDER) {
      case 'twilio': return await sendViaTwilio(phone, message);
      case 'msg91': return await sendViaMsg91(phone, message);
      default: logger.info({ to: phone, message: message.slice(0, 50) }, 'SMS (console mode)'); return true;
    }
  } catch (err) {
    logger.error({ err, to: phone }, 'SMS send failed');
    return false;
  }
}

async function sendViaTwilio(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return false;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  });
  return res.ok;
}

async function sendViaMsg91(to: string, message: string): Promise<boolean> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'METASC';
  if (!authKey) return false;

  const res = await fetch('https://api.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'authkey': authKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: senderId, route: '4', country: '91', sms: [{ message, to: [to.replace('+91', '')] }] }),
  });
  return res.ok;
}

/** Send admission alert SMS to admin */
export async function sendAdmissionAlert(adminPhone: string, studentName: string, program: string): Promise<boolean> {
  return sendSms(adminPhone, `New admission inquiry: ${studentName} for ${program}. Check admin panel.`);
}
