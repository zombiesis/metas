/**
 * Session cookie name shared by admin-auth.ts, tenant.ts, and middleware.ts.
 * Kept in its own file to avoid importing the heavy admin-auth module from
 * tenant.ts (and to break a potential import cycle between them).
 */
export const SESSION_COOKIE = 'metas_admin_session';
