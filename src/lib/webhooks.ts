import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';

type WebhookPayload = {
  event: string;
  branch: string | null;
  data: Record<string, unknown>;
  timestamp: string;
};

/** Send webhook notification for form submissions */
export async function notifyWebhook(event: string, data: Record<string, unknown>) {
  const branchId = await getCurrentBranchId();
  const setting = await prisma.siteSetting.findFirst({ where: { key: 'webhook_url', branchId } }).catch(() => null);
  if (!setting?.value) return;

  const urls = setting.value.split('\n').map(u => u.trim()).filter(Boolean);
  const payload: WebhookPayload = { event, branch: branchId, data, timestamp: new Date().toISOString() };

  for (const url of urls) {
    if (!isAllowedWebhookUrl(url)) continue;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Event': event },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null); // fire-and-forget
  }
}

/** Validate webhook URL to prevent SSRF */
function isAllowedWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    // Block localhost
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    // Block IPv6 loopback and link-local
    if (host === '[::1]' || host.startsWith('[::ffff:') || host.startsWith('[fe80:') || host.startsWith('[fd')) return false;
    // Block private IPv4 ranges
    if (host.startsWith('10.') || host.startsWith('192.168.')) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    // Block AWS/cloud metadata
    if (host === '169.254.169.254' || host === '[fd00::1]') return false;
    // Block internal domains
    if (host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.localhost')) return false;
    return true;
  } catch { return false; }
}

/** Webhook events */
export const WEBHOOK_EVENTS = {
  FORM_SUBMITTED: 'form.submitted',
  ADMISSION_LEAD: 'admission.new_lead',
  CONTACT_INQUIRY: 'contact.new_inquiry',
  CONTENT_PUBLISHED: 'content.published',
  USER_LOGIN: 'user.login',
} as const;
