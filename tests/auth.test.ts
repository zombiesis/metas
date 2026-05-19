import { describe, it, expect } from 'vitest';
import { validatePasswordStrength, hashPassword } from '@/lib/admin-auth';

describe('Password Validation', () => {
  it('rejects short passwords', () => {
    const result = validatePasswordStrength('Short1!');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('At least 12 characters');
  });

  it('rejects passwords without uppercase', () => {
    const result = validatePasswordStrength('alllowercase1!');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('At least one uppercase letter');
  });

  it('rejects passwords without lowercase', () => {
    const result = validatePasswordStrength('ALLUPPERCASE1!');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('At least one lowercase letter');
  });

  it('rejects passwords without numbers', () => {
    const result = validatePasswordStrength('NoNumbersHere!');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('At least one number');
  });

  it('rejects passwords without special chars', () => {
    const result = validatePasswordStrength('NoSpecial1234A');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('At least one special character');
  });

  it('accepts strong passwords', () => {
    const result = validatePasswordStrength('Str0ng!Pass#99');
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Password Hashing', () => {
  it('produces a bcrypt hash', async () => {
    const hash = await hashPassword('TestPassword1!');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('produces different hashes for same input (salt)', async () => {
    const h1 = await hashPassword('TestPassword1!');
    const h2 = await hashPassword('TestPassword1!');
    expect(h1).not.toBe(h2);
  });
});
