import { describe, it, expect } from 'vitest';
import { generateTotpSecret, verifyTotp, generateRecoveryCodes } from '@/lib/totp';
import { validatePasswordStrength } from '@/lib/admin-auth';
import { encrypt, decrypt } from '@/lib/crypto';

describe('Auth + 2FA Integration Flow', () => {
  it('full 2FA setup → encrypt → decrypt → verify cycle', () => {
    // 1. Generate TOTP secret
    const secret = generateTotpSecret();
    expect(secret.length).toBeGreaterThan(20);

    // 2. Encrypt the secret (as stored in DB)
    const encrypted = encrypt(secret);
    expect(encrypted).not.toBe(secret);
    expect(encrypted).toContain(':'); // iv:tag:ciphertext format

    // 3. Decrypt it back
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);

    // 4. Verify that a wrong token fails
    expect(verifyTotp(decrypted, '000000')).toBe(false);
  });

  it('recovery codes are unique and properly formatted', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    const unique = new Set(codes);
    expect(unique.size).toBe(8);
    codes.forEach((code) => {
      expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    });
  });

  it('encryption produces different ciphertext for same plaintext', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const e1 = encrypt(secret);
    const e2 = encrypt(secret);
    expect(e1).not.toBe(e2); // different IV each time
    expect(decrypt(e1)).toBe(secret);
    expect(decrypt(e2)).toBe(secret);
  });

  it('rejects tampered ciphertext', () => {
    const secret = 'TESTKEY123';
    const encrypted = encrypt(secret);
    const tampered = encrypted.slice(0, -2) + 'ff';
    expect(() => decrypt(tampered)).toThrow();
  });

  it('password validation integrates with user creation requirements', () => {
    // Weak passwords rejected
    expect(validatePasswordStrength('short').ok).toBe(false);
    expect(validatePasswordStrength('nouppercase1!').ok).toBe(false);

    // Strong password accepted
    const strong = 'MyStr0ng!Pass#2024';
    const result = validatePasswordStrength(strong);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
