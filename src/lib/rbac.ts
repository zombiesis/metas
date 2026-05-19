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

/** Check if a role has a permission — queries DB with 60s cache */
export async function can(roleName: string | undefined | null, permission: string): Promise<boolean> {
  if (!roleName) return false;
  if (roleName === 'Super Admin') return true;
  const permissions = await getPermissionsForRole(roleName);
  return permissions.has(permission);
}

/** Synchronous fallback for non-async contexts (uses cache only, returns false on miss) */
export function canSync(roleName: string | undefined | null, permission: string): boolean {
  if (!roleName) return false;
  if (roleName === 'Super Admin') return true;
  const cached = cache.get(roleName);
  if (!cached || cached.expires < Date.now()) return false;
  return cached.permissions.has(permission);
}

/** Invalidate cache (call after role permission changes) */
export function invalidateRbacCache(roleName?: string) {
  if (roleName) cache.delete(roleName);
  else cache.clear();
}
