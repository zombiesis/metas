import { prisma } from '@/lib/prisma';

export const ROLE_NAMES = [
  'Super Admin',
  'Principal',
  'Admissions Manager',
  'Placement Officer',
  'IQAC Coordinator',
  'Faculty Editor',
  'Media Editor',
  'HR Manager',
  'Viewer'
] as const;

export const PERMISSIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'publish',
  'archive',
  'export',
  'manage_users',
  'manage_branches',
  'switch_branch',
  'view_analytics',
  'view_audit_logs',
  'manage_security'
] as const;

// Cache role permissions for 60 seconds to avoid DB hit on every request
const cache = new Map<string, { permissions: Set<string>; expires: number }>();
const CACHE_TTL = 60_000;

async function getPermissionsForRole(roleName: string): Promise<Set<string>> {
  const cached = cache.get(roleName);
  if (cached && cached.expires > Date.now()) return cached.permissions;

  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: { permissions: { include: { permission: true } } }
  }).catch(() => null);

  const permissions = new Set(role?.permissions.map((rp) => rp.permission.key) || []);
  cache.set(roleName, { permissions, expires: Date.now() + CACHE_TTL });
  return permissions;
}

/**
 * Async permission check — this is what production route handlers should call.
 * Hits the DB once per role per 60 seconds and caches the result.
 */
export async function can(roleName: string | undefined | null, permission: string): Promise<boolean> {
  if (!roleName) return false;
  if (roleName === 'Super Admin') return true;
  const permissions = await getPermissionsForRole(roleName);
  return permissions.has(permission);
}

/**
 * Eagerly fill the in-memory cache for a list of roles. Call this from a place
 * that already has an await context (admin layouts, request handlers) when you
 * intend to use `canSync` later in synchronous code paths (e.g., client-component
 * props that flow through the boundary).
 */
export async function preloadPermissions(roleNames: ReadonlyArray<string>): Promise<void> {
  await Promise.all(roleNames.map((name) => getPermissionsForRole(name)));
}

/**
 * Synchronous permission check for the rare contexts that cannot await
 * (mostly tests). FAIL-CLOSED: returns `false` whenever the role is not yet in
 * the cache, so a fresh process won't accidentally grant access. If you need
 * a reliable answer in code that isn't ready to be async, call
 * `preloadPermissions([role])` first.
 */
export function canSync(roleName: string | undefined | null, permission: string): boolean {
  if (!roleName) return false;
  if (roleName === 'Super Admin') return true;
  const cached = cache.get(roleName);
  if (!cached || cached.expires < Date.now()) return false; // fail-closed on cache miss
  return cached.permissions.has(permission);
}

/** Invalidate cache (call after role permission changes) */
export function invalidateRbacCache(roleName?: string) {
  if (roleName) cache.delete(roleName);
  else cache.clear();
}
