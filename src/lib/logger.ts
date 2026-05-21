import pino from 'pino';
import { headers } from 'next/headers';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  ...(process.env.NODE_ENV !== 'production' && { transport: { target: 'pino/file', options: { destination: 1 } } }),
});

export const authLogger = logger.child({ module: 'auth' });
export const securityLogger = logger.child({ module: 'security' });
export const cmsLogger = logger.child({ module: 'cms' });

/** Get a request-scoped logger with requestId for tracing */
export async function getRequestLogger(module = 'app') {
  let requestId = 'unknown';
  try { const h = await headers(); requestId = h.get('x-request-id') || 'unknown'; } catch {}
  return logger.child({ module, requestId });
}
