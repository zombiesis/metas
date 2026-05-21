import { createHmac, randomBytes } from 'node:crypto';

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const ISSUER = 'MetasAdventistCMS';
const RECOVERY_CODE_COUNT = 8;

/** Generate a random 20-byte base32-encoded secret */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Generate a set of one-time recovery codes */
export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    randomBytes(4).toString('hex').toUpperCase().match(/.{4}/g)!.join('-')
  );
}

/** Build otpauth:// URI for QR code scanning */
export function getTotpUri(secret: string, username: string): string {
  const label = encodeURIComponent(`${ISSUER}:${username}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/** Verify a TOTP token (checks current window ±1). Returns the counter if valid, null if invalid. */
export function verifyTotp(secret: string, token: string, lastCounter?: number | null): { valid: boolean; counter: number | null } {
  if (!/^\d{6}$/.test(token)) return { valid: false, counter: null };
  const now = Math.floor(Date.now() / 1000);
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((now + offset * TOTP_PERIOD) / TOTP_PERIOD);
    if (generateHotp(secret, counter) === token) {
      // Replay protection: reject if counter already used
      if (lastCounter != null && counter <= lastCounter) return { valid: false, counter: null };
      return { valid: true, counter };
    }
  }
  return { valid: false, counter: null };
}

function generateHotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % 10 ** TOTP_DIGITS;
  return code.toString().padStart(TOTP_DIGITS, '0');
}

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0, value = 0, result = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_CHARS[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  return result;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const char of cleaned) {
    value = (value << 5) | BASE32_CHARS.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}
