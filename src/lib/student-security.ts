/**
 * Student Portal Security Utilities
 * Prevents code visibility, API abuse, and tampering
 */

/** Generic error response — never reveals internals */
export function safeError(status: number): Response {
  const messages: Record<number, string> = {
    400: 'Invalid request',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Not found',
    429: 'Too many requests. Try again later.',
    500: 'Something went wrong',
  };
  return Response.json({ error: messages[status] || 'Error' }, { status });
}

/** Validate request origin — block Postman/curl without proper headers */
export function validateRequestOrigin(request: Request): boolean {
  // In production, require requests to come from our own frontend
  if (process.env.NODE_ENV !== 'production') return true;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  // Must have either origin or referer matching our host
  if (!origin && !referer) return false;
  if (origin && !origin.includes(host || '')) return false;
  return true;
}

/** Rate limit key for student — uses session ID not IP (students share campus IP) */
export function studentRateKey(studentId: string, action: string): string {
  return `student:${studentId}:${action}`;
}

/** Mask PII for logging — never log full phone/email/aadhaar */
export function maskPii(value: string, type: 'phone' | 'email' | 'aadhaar'): string {
  switch (type) {
    case 'phone': return value.length > 4 ? '***' + value.slice(-4) : '***';
    case 'email': {
      const [local, domain] = value.split('@');
      return local ? `${local[0]}***@${domain}` : '***';
    }
    case 'aadhaar': return value.length > 4 ? 'XXXX-XXXX-' + value.slice(-4) : 'XXXX';
    default: return '***';
  }
}

/** Security headers for student API responses */
export const STUDENT_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'X-Robots-Tag': 'noindex, nofollow',
};
