import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  ...(process.env.NODE_ENV !== 'production' && { transport: { target: 'pino/file', options: { destination: 1 } } }),
});

export const authLogger = logger.child({ module: 'auth' });
export const securityLogger = logger.child({ module: 'security' });
export const cmsLogger = logger.child({ module: 'cms' });
