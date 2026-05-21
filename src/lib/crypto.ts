import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const KEY_ENV = 'ENCRYPTION_KEY';
const MIN_KEY_LENGTH = 32;
// Fixed application-wide salt is acceptable here because the key itself is
// the secret; salt rotation would require re-encrypting the entire DB. If/when
// rotation is needed, version ciphertext with a leading "v1:" prefix.
const KDF_SALT = 'metas-salt';

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env[KEY_ENV];

  // Tests run under NODE_ENV=test (vitest default) and don't load the .env file.
  // Provide a deterministic test-only key so the crypto suite can run without
  // requiring every contributor to export ENCRYPTION_KEY locally. This branch
  // is unreachable in `next dev`/`next start`/CI build, all of which run under
  // NODE_ENV=development|production.
  if (!raw) {
    if (process.env.NODE_ENV === 'test') {
      cachedKey = scryptSync('metas-test-only-key-not-for-production', KDF_SALT, 32);
      return cachedKey;
    }
    throw new Error(
      `${KEY_ENV} is not set. Generate one with \`openssl rand -base64 48\` and put it in .env`,
    );
  }

  if (raw.length < MIN_KEY_LENGTH) {
    throw new Error(`${KEY_ENV} must be at least ${MIN_KEY_LENGTH} characters long (got ${raw.length})`);
  }

  cachedKey = scryptSync(raw, KDF_SALT, 32);
  return cachedKey;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivHex, tagHex, encHex] = parts;
  if (!ivHex || !tagHex) throw new Error('Invalid ciphertext format');
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}
