import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-signed branch selection cookie.
 *
 * Threat model addressed:
 * - An attacker MUST NOT be able to forge the cookie value to reach a branch
 *   they don't have access to (HMAC binds branchId to a server secret).
 * - An attacker MUST NOT be able to take user A's signed cookie and reuse it
 *   inside user B's session to escalate into A's branches (the cookie embeds
 *   the userId; callers are expected to also confirm the active session
 *   belongs to that same userId).
 *
 * The cookie format is `{userId}.{branchId}.{base64url(HMAC_SHA256)}`.
 */
export const BRANCH_COOKIE = 'metas_admin_branch';
const SEPARATOR = '.';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return '';
  return secret;
}

/** Produce a signed cookie value tying `userId` to `branchId`. */
export function signBranchCookie(userId: string, branchId: string): string {
  if (!userId || !branchId) throw new Error('userId and branchId are required');
  if (userId.includes(SEPARATOR) || branchId.includes(SEPARATOR)) {
    throw new Error('userId/branchId must not contain "."');
  }
  const payload = `${userId}${SEPARATOR}${branchId}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}${SEPARATOR}${sig}`;
}

/**
 * Verify a signed cookie. Returns the embedded `{userId, branchId}` only if
 * the HMAC is valid. Callers MUST still check that `userId` matches the active
 * session before trusting `branchId`.
 */
export function verifyBranchCookie(value: string | undefined | null): { userId: string; branchId: string } | null {
  if (!value) return null;
  const parts = value.split(SEPARATOR);
  if (parts.length !== 3) return null;
  const [userId, branchId, sig] = parts;
  if (!userId || !branchId || !sig) return null;

  let expectedSig: string;
  try {
    expectedSig = createHmac('sha256', getSecret()).update(`${userId}${SEPARATOR}${branchId}`).digest('base64url');
  } catch {
    return null;
  }
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  try {
    return timingSafeEqual(sigBuf, expectedBuf) ? { userId, branchId } : null;
  } catch {
    return null;
  }
}
