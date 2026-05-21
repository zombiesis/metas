import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { S3Client } from '@aws-sdk/client-s3';

/**
 * File storage abstraction. Backed by S3 (or any S3-compatible target — MinIO,
 * R2, Backblaze B2) when `S3_BUCKET` is configured, otherwise the local
 * filesystem under `public/uploads/`.
 *
 * Audit-#2 N7: the previous implementation hand-rolled AWS SigV4 with a path
 * that wasn't URL-encoded segment-by-segment, so any key containing space, `+`,
 * `=`, or unicode produced a `SignatureDoesNotMatch` 403 from S3. Switched to
 * `@aws-sdk/client-s3`, which handles canonicalization correctly.
 *
 * N22: AWS region is read from `AWS_REGION` first (the canonical name across
 * AWS SDKs and the rest of this codebase) and only falls back to the legacy
 * `S3_REGION` for backward compatibility.
 */
const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.AWS_REGION || process.env.S3_REGION || 'ap-south-1';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT; // for MinIO / R2 / B2

export const useS3 = Boolean(S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY);

let s3Client: S3Client | null = null;
async function getS3Client(): Promise<S3Client> {
  if (s3Client) return s3Client;
  const { S3Client } = await import('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT, // undefined for AWS, set for MinIO/R2/B2
    forcePathStyle: Boolean(S3_ENDPOINT),
    credentials: { accessKeyId: S3_ACCESS_KEY!, secretAccessKey: S3_SECRET_KEY! },
  });
  return s3Client;
}

/** Upload a file buffer to S3 or local filesystem. */
export async function uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
  if (useS3) return uploadToS3(buffer, key, contentType);
  return uploadToLocal(buffer, key);
}

/** Delete a file from S3 or local filesystem. */
export async function deleteFile(key: string): Promise<void> {
  if (useS3) return deleteFromS3(key);
  return deleteFromLocal(key);
}

/** Public URL for a stored file. */
export function getFileUrl(key: string): string {
  if (useS3) {
    if (S3_ENDPOINT) return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
  }
  return `/${key}`;
}

/** Pre-signed URL for time-limited reads (handy for private uploads). */
export async function getSignedReadUrl(key: string, expiresInSeconds = 60 * 5): Promise<string> {
  if (!useS3) return getFileUrl(key);
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET!, Key: key });
  return getSignedUrl(await getS3Client(), cmd, { expiresIn: expiresInSeconds });
}

// --- S3 implementation ---

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
    }),
  );
  return getFileUrl(key);
}

async function deleteFromS3(key: string): Promise<void> {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET!, Key: key })).catch(() => null);
}

// --- Local filesystem fallback ---

async function uploadToLocal(buffer: Buffer, key: string): Promise<string> {
  // Defensive: even though the upload route already prefixes `uploads/<branch>/`
  // here we strip any traversal segments and re-anchor under `public/uploads/`
  // so a misconfigured caller cannot write to (e.g.) `public/sw.js`.
  const safeKey = key.replace(/\.\./g, '').replace(/[^a-zA-Z0-9/_\-.]/g, '');
  const filePath = path.join(process.cwd(), 'public', safeKey);
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  if (!filePath.startsWith(uploadsRoot)) throw new Error('Invalid upload path');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return `/${safeKey}`;
}

async function deleteFromLocal(key: string): Promise<void> {
  const safeKey = key.replace(/\.\./g, '').replace(/[^a-zA-Z0-9/_\-.]/g, '');
  const filePath = path.join(process.cwd(), 'public', safeKey);
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  if (!filePath.startsWith(uploadsRoot)) return; // ignore traversal attempts
  await fs.unlink(filePath).catch(() => null);
}
