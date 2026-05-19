import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { listUploads } from '@/lib/cms-db';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { can } from '@/lib/rbac';
import { allowedUploadExtensions, allowedUploadMimePrefixes, maxUploadBytes, logSecurityEvent } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeName(value: string) {
  const parsed = path.parse(value);
  const ext = parsed.ext.toLowerCase();
  const base = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'upload';
  return { name: `${base}-${Date.now()}${ext}`, ext };
}

function allowedMime(mime: string) {
  if (!mime) return true;
  return allowedUploadMimePrefixes.some((prefix) => mime.startsWith(prefix));
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const [files, media] = await Promise.all([listUploads(), prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } })]);
  return NextResponse.json({ ok: true, files, media });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!can(auth.session!.roleName, 'create')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const form = await request.formData();
  const file = form.get('file');
  const title = String(form.get('title') || '');
  const altText = String(form.get('altText') || '');
  const folder = String(form.get('folder') || 'general').toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'general';
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'No file uploaded.' }, { status: 400 });
  const { name, ext } = safeName(file.name);
  if (!allowedUploadExtensions.has(ext) || !allowedMime(file.type)) {
    await logSecurityEvent({ event: 'blocked_upload_type', severity: 'warning', summary: `Blocked upload ${file.name}`, userId: auth.session!.userId, request });
    return NextResponse.json({ ok: false, error: `File type ${ext || file.type} is not allowed.` }, { status: 400 });
  }
  if (file.size > maxUploadBytes) {
    await logSecurityEvent({ event: 'blocked_upload_size', severity: 'warning', summary: `Blocked oversized upload ${file.name}`, userId: auth.session!.userId, request });
    return NextResponse.json({ ok: false, error: 'File is larger than 15 MB.' }, { status: 400 });
  }
  const year = String(new Date().getFullYear());
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, folder);
  await fs.mkdir(uploadDir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, name), bytes);
  const url = `/uploads/${year}/${folder}/${name}`;
  const media = await prisma.mediaAsset.create({
    data: {
      title: title || file.name,
      fileName: name,
      url,
      mimeType: file.type || ext.replace('.', ''),
      size: file.size,
      folder,
      altText: altText || null,
      status: 'active',
      createdBy: auth.session!.username,
      updatedBy: auth.session!.username
    }
  });
  await auditLog({ action: 'uploaded_file', entityType: 'MediaAsset', entityId: media.id, summary: `Uploaded ${name}`, userId: auth.session!.userId, afterValue: media, request });
  return NextResponse.redirect(new URL('/admin/media?uploaded=1', request.url), { status: 303 });
}
