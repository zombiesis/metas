import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '@/lib/crypto';

describe('Crypto encrypt/decrypt', () => {
  it('encrypts and decrypts a simple string', () => {
    const plain = 'hello-world';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('handles empty string', () => {
    expect(decrypt(encrypt(''))).toBe('');
  });

  it('handles unicode characters', () => {
    const plain = '🔐 Ñoño 日本語';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('handles long strings (base32 TOTP secrets)', () => {
    const plain = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const plain = 'same-input';
    const a = encrypt(plain);
    const b = encrypt(plain);
    expect(a).not.toBe(b);
  });

  it('rejects tampered ciphertext (auth tag)', () => {
    const encrypted = encrypt('secret');
    const parts = encrypted.split(':');
    parts[1] = 'deadbeefdeadbeefdeadbeefdeadbeef'; // tamper auth tag
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('rejects truncated ciphertext', () => {
    expect(() => decrypt('abc')).toThrow();
    expect(() => decrypt('')).toThrow();
  });

  it('rejects malformed format', () => {
    expect(() => decrypt('only:two')).toThrow();
  });
});
