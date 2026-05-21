import { headers } from 'next/headers';

export const CSP_NONCE_HEADER = 'x-csp-nonce';

/**
 * Read the per-request CSP nonce that middleware.ts pushes onto the request
 * headers. Returns undefined when there is no active request (e.g. at build
 * time); callers should treat that as "no inline script allowed".
 *
 * Usage from a Server Component:
 *
 *   const nonce = await getCspNonce();
 *   <script nonce={nonce} dangerouslySetInnerHTML={{ __html: '...' }} />
 */
export async function getCspNonce(): Promise<string | undefined> {
  try {
    const h = await headers();
    return h.get(CSP_NONCE_HEADER) ?? undefined;
  } catch {
    return undefined;
  }
}
