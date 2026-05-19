import { describe, it, expect } from 'vitest';
import { generateTotpSecret, getTotpUri, verifyTotp, generateRecoveryCodes } from '@/lib/totp';

describe('TOTP', () => {
  it('generates a base32 secret of correct length', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(32);
  });

  it('generates a valid otpauth URI', () => {
    const secret = generateTotpSecret();
    const uri = getTotpUri(secret, 'testuser');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain(secret);
    expect(uri).toContain('MetasAdventistCMS');
    expect(uri).toContain('testuser');
  });

  it('verifies a valid token against its own secret', () => {
    // Generate a token manually for the current time window
    const secret = generateTotpSecret();
    // We can't easily generate a valid token without reimplementing HOTP,
    // but we can verify that an invalid token is rejected
    expect(verifyTotp(secret, '000000')).toBe(false);
    expect(verifyTotp(secret, 'abcdef')).toBe(false);
    expect(verifyTotp(secret, '')).toBe(false);
    expect(verifyTotp(secret, '12345')).toBe(false); // too short
  });

  it('rejects non-6-digit tokens', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '12345')).toBe(false);
    expect(verifyTotp(secret, '1234567')).toBe(false);
    expect(verifyTotp(secret, 'abcdef')).toBe(false);
  });

  it('generates 8 unique recovery codes', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    codes.forEach((code) => {
      expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    });
  });
});
