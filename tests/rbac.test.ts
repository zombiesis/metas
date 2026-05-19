import { describe, it, expect } from 'vitest';
import { canSync } from '@/lib/rbac';

describe('RBAC', () => {
  it('Super Admin can do everything (sync)', () => {
    expect(canSync('Super Admin', 'view')).toBe(true);
    expect(canSync('Super Admin', 'create')).toBe(true);
    expect(canSync('Super Admin', 'delete')).toBe(true);
    expect(canSync('Super Admin', 'manage_users')).toBe(true);
    expect(canSync('Super Admin', 'manage_security')).toBe(true);
  });

  it('null/undefined role has no permissions', () => {
    expect(canSync(null, 'view')).toBe(false);
    expect(canSync(undefined, 'create')).toBe(false);
    expect(canSync('', 'edit')).toBe(false);
  });

  it('unknown role without cache returns false', () => {
    expect(canSync('NonExistent', 'view')).toBe(false);
  });
});
