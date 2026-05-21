const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Verify a Cloudflare Turnstile token server-side */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // Skip if not configured (dev mode)
  if (!token) return false;

  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, ...(ip ? { remoteip: ip } : {}) }),
  });

  const data = await res.json();
  return data.success === true;
}
