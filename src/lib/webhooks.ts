import { prisma } from '@/lib/prisma';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

type WebhookPayload = {
  event: string;
  branch: string | null;
  data: Record<string, unknown>;
  timestamp: string;
  // Zapier-compatible flat fields
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
};

/**
 * Send webhook notification for form submissions.
 *
 * Audit-#2 N17: SSRF protection now also resolves the hostname and re-checks
 * the IP, defeating the DNS-rebinding pattern where `evil.com` resolves to a
 * public IP at validation time and then to `127.0.0.1` at fetch time.
 */
export async function notifyWebhook(event: string, data: Record<string, unknown>, branchId?: string | null) {
  const bid = branchId ?? null;
  const setting = await prisma.siteSetting.findFirst({ where: { key: 'webhook_url', branchId: bid || '' } }).catch(() => null);
  if (!setting?.value) return;

  const urls = setting.value.split('\n').map(u => u.trim()).filter(Boolean);
  const payload: WebhookPayload = { event, branch: bid, data, timestamp: new Date().toISOString(), name: String(data.name || ''), email: String(data.email || ''), phone: String(data.phone || '') };

  for (const url of urls) {
    if (!(await isAllowedWebhookUrl(url))) continue;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Event': event },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null); // fire-and-forget
  }
}

/** Range checks on a literal IP (v4 or v6). */
function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip) return true;
  // IPv6 first
  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true;
    if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // IPv4-mapped IPv6 like ::ffff:127.0.0.1
    const mapped = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mapped) return isPrivateOrLocalIp(mapped[1]);
    return false;
  }
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true; // junk → reject
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local + AWS metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

/** Validate webhook URL to prevent SSRF, including DNS rebinding (audit-#2 N17). */
export async function isAllowedWebhookUrl(url: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (!['https:', 'http:'].includes(parsed.protocol)) return false;
  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host) return false;

  // Cheap deny-list on raw hostname before we ever touch DNS
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return false;

  // If the host is a literal IP, validate it directly.
  if (isIP(host)) return !isPrivateOrLocalIp(host);

  // Otherwise resolve to all addresses and reject if ANY of them is private.
  // This covers the DNS-rebinding case where multi-record DNS returns both
  // a public and a private IP.
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    return false;
  }
  if (addrs.length === 0) return false;
  return addrs.every((a) => !isPrivateOrLocalIp(a.address));
}

/** Webhook events */
export const WEBHOOK_EVENTS = {
  FORM_SUBMITTED: 'form.submitted',
  ADMISSION_LEAD: 'admission.new_lead',
  CONTACT_INQUIRY: 'contact.new_inquiry',
  CONTENT_PUBLISHED: 'content.published',
  USER_LOGIN: 'user.login',
} as const;
