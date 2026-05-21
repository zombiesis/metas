import { promises as fs } from 'node:fs';
import path from 'node:path';

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || 'ap-south-1';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT; // for MinIO/R2 compatibility

export const useS3 = Boolean(S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY);

/** Upload a file buffer to S3 or local filesystem */
export async function uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (useS3) return uploadToS3(buffer, key, contentType);
  return uploadToLocal(buffer, key);
}

/** Delete a file from S3 or local filesystem */
export async function deleteFile(key: string): Promise<void> {
  if (useS3) return deleteFromS3(key);
  return deleteFromLocal(key);
}

/** Get the public URL for a file */
export function getFileUrl(key: string): string {
  if (useS3) {
    if (S3_ENDPOINT) return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  }
  return `/${key}`;
}

// --- S3 Implementation (using AWS SDK v3 signature) ---

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const url = S3_ENDPOINT
    ? `${S3_ENDPOINT}/${S3_BUCKET}/${key}`
    : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

  const date = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dateShort = date.slice(0, 8);

  // Use simple PUT with presigned-style headers (requires s3:PutObject permission)
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Length': String(buffer.length),
    'x-amz-date': date,
    'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
  };

  // For production, use @aws-sdk/client-s3. This is a lightweight fallback.
  const { createHmac, createHash } = await import('node:crypto');

  function hmac(key: Buffer | string, data: string) { return createHmac('sha256', key).update(data).digest(); }
  function sha256(data: string) { return createHash('sha256').update(data).digest('hex'); }

  const scope = `${dateShort}/${S3_REGION}/s3/aws4_request`;
  const canonicalHeaders = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k.toLowerCase()}:${v}`).join('\n') + '\n';
  const signedHeaders = Object.keys(headers).map(k => k.toLowerCase()).sort().join(';');
  const parsedUrl = new URL(url);
  const canonicalRequest = `PUT\n${parsedUrl.pathname}\n\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`;
  const stringToSign = `AWS4-HMAC-SHA256\n${date}\n${scope}\n${sha256(canonicalRequest)}`;

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${S3_SECRET_KEY}`, dateShort), S3_REGION!), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, { method: 'PUT', headers, body: new Uint8Array(buffer) });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status} ${await res.text()}`);
  return getFileUrl(key);
}

async function deleteFromS3(key: string): Promise<void> {
  const url = S3_ENDPOINT
    ? `${S3_ENDPOINT}/${S3_BUCKET}/${key}`
    : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

  const { createHmac, createHash } = await import('node:crypto');
  const date = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dateShort = date.slice(0, 8);
  const headers: Record<string, string> = { 'x-amz-date': date, 'x-amz-content-sha256': 'UNSIGNED-PAYLOAD' };

  function hmac(k: Buffer | string, d: string) { return createHmac('sha256', k).update(d).digest(); }
  function sha256(d: string) { return createHash('sha256').update(d).digest('hex'); }

  const scope = `${dateShort}/${S3_REGION}/s3/aws4_request`;
  const parsedUrl = new URL(url);
  const canonicalHeaders = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k.toLowerCase()}:${v}`).join('\n') + '\n';
  const signedHeaders = Object.keys(headers).map(k => k.toLowerCase()).sort().join(';');
  const canonicalRequest = `DELETE\n${parsedUrl.pathname}\n\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`;
  const stringToSign = `AWS4-HMAC-SHA256\n${date}\n${scope}\n${sha256(canonicalRequest)}`;
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${S3_SECRET_KEY}`, dateShort), S3_REGION!), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  await fetch(url, { method: 'DELETE', headers }).catch(() => null);
}

// --- Local filesystem fallback ---

async function uploadToLocal(buffer: Buffer, key: string): Promise<string> {
  const safeKey = key.replace(/\.\./g, '').replace(/[^a-zA-Z0-9/_\-\.]/g, '');
  const filePath = path.join(process.cwd(), 'public', safeKey);
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  if (!filePath.startsWith(uploadsRoot)) throw new Error('Invalid upload path');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return `/${safeKey}`;
}

async function deleteFromLocal(key: string): Promise<void> {
  const filePath = path.join(process.cwd(), 'public', key);
  await fs.unlink(filePath).catch(() => null);
}
