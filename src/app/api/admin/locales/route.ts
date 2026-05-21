import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const SUPPORTED_LOCALES = ['en', 'hi', 'gu'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** GET: list content available in each locale */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const branchId = await getCurrentBranchId();
  const w = branchId ? { branchId } : {};
  const collection = request.nextUrl.searchParams.get('collection') || 'pages';

  const localeCounts: Record<string, number> = {};
  for (const locale of SUPPORTED_LOCALES) {
    let count = 0;
    switch (collection) {
      case 'pages': count = await prisma.page.count({ where: { ...w, locale } }); break;
      case 'programs': count = await prisma.program.count({ where: { ...w, locale } }); break;
      case 'notices': count = await prisma.notice.count({ where: { ...w, locale } }); break;
    }
    localeCounts[locale] = count;
  }

  return NextResponse.json({ ok: true, collection, locales: localeCounts, supported: SUPPORTED_LOCALES });
}

/** POST: duplicate content to another locale */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const { collection, id, targetLocale } = await request.json();
  if (!SUPPORTED_LOCALES.includes(targetLocale)) return NextResponse.json({ ok: false, error: 'Unsupported locale' }, { status: 400 });

  switch (collection) {
    case 'pages': {
      const source = await prisma.page.findUnique({ where: { id } });
      if (!source) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      const copy = await prisma.page.create({ data: { branchId: source.branchId, slug: `${source.slug}-${targetLocale}`, locale: targetLocale, title: `[${targetLocale.toUpperCase()}] ${source.title}`, summary: source.summary, body: source.body, status: 'draft', metadata: source.metadata, createdBy: auth.session!.username, updatedBy: auth.session!.username } });
      return NextResponse.json({ ok: true, record: copy });
    }
    case 'programs': {
      const source = await prisma.program.findUnique({ where: { id } });
      if (!source) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      const copy = await prisma.program.create({ data: { branchId: source.branchId, slug: `${source.slug}-${targetLocale}`, locale: targetLocale, title: `[${targetLocale.toUpperCase()}] ${source.title}`, category: source.category, status: 'draft', duration: source.duration, eligibility: source.eligibility, summary: source.summary, overview: source.overview, faqs: source.faqs, rules: source.rules, documents: source.documents, facultyIds: source.facultyIds, createdBy: auth.session!.username, updatedBy: auth.session!.username } });
      return NextResponse.json({ ok: true, record: copy });
    }
    default: return NextResponse.json({ ok: false, error: 'Collection not supported for locale duplication' }, { status: 400 });
  }
}
