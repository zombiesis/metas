import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST: auto-generate SEO meta for content that's missing it */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { collection, id } = await request.json();
  const branchId = await getCurrentBranchId();

  if (id) {
    // Generate for single record
    const result = await generateSeoForRecord(collection, id);
    return NextResponse.json({ ok: true, ...result });
  }

  // Batch: generate for all records missing SEO in this branch
  const w = branchId ? { branchId } : {};
  let updated = 0;

  if (!collection || collection === 'pages') {
    const pages = await prisma.page.findMany({ where: { ...w, seoDescription: null, status: 'published' }, take: 50 });
    for (const p of pages) {
      const desc = generateDescription(p.title, p.summary || p.body || '');
      await prisma.page.update({ where: { id: p.id }, data: { seoTitle: p.title.slice(0, 60), seoDescription: desc } });
      updated++;
    }
  }

  if (!collection || collection === 'programs') {
    const programs = await prisma.program.findMany({ where: { ...w, seoDescription: null, status: 'published' }, take: 50 });
    for (const p of programs) {
      const desc = generateDescription(p.title, p.summary || p.overview || '');
      await prisma.program.update({ where: { id: p.id }, data: { seoTitle: `${p.title} - ${p.category}`.slice(0, 60), seoDescription: desc } });
      updated++;
    }
  }

  return NextResponse.json({ ok: true, updated });
}

async function generateSeoForRecord(collection: string, id: string) {
  let title = '', body = '';
  if (collection === 'pages') {
    const r = await prisma.page.findUnique({ where: { id } });
    if (r) { title = r.title; body = r.summary || r.body || ''; }
  } else if (collection === 'programs') {
    const r = await prisma.program.findUnique({ where: { id } });
    if (r) { title = r.title; body = r.summary || r.overview || ''; }
  }
  return { seoTitle: title.slice(0, 60), seoDescription: generateDescription(title, body) };
}

function generateDescription(title: string, content: string): string {
  const plain = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (plain.length > 20) return plain.slice(0, 155) + (plain.length > 155 ? '...' : '');
  return `Learn about ${title} at Metas Adventist College, Surat. Values-based higher education for academic excellence.`.slice(0, 160);
}
