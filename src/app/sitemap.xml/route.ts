import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveBranchByDomain } from '@/lib/tenant';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const h = await headers();
  const host = h.get('host')?.split(':')[0] || 'localhost';
  const branchId = await resolveBranchByDomain(host);
  const w = branchId ? { branchId } : {};
  const baseUrl = `https://${host}`;

  const [pages, programs, notices, events, blogs] = await Promise.all([
    prisma.page.findMany({ where: { ...w, status: 'published', deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.program.findMany({ where: { ...w, status: 'published', deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.notice.findMany({ where: { ...w, status: 'active', deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.event.findMany({ where: { ...w, status: 'published' }, select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { ...w, status: 'published' }, select: { slug: true, updatedAt: true } }),
  ]);

  const urls = [
    { loc: baseUrl, lastmod: new Date().toISOString().slice(0, 10), priority: '1.0' },
    { loc: `${baseUrl}/about`, priority: '0.8' },
    { loc: `${baseUrl}/contact`, priority: '0.7' },
    { loc: `${baseUrl}/admissions`, priority: '0.9' },
    { loc: `${baseUrl}/faculty`, priority: '0.7' },
    ...pages.map(p => ({ loc: `${baseUrl}/${p.slug}`, lastmod: p.updatedAt.toISOString().slice(0, 10), priority: '0.7' })),
    ...programs.map(p => ({ loc: `${baseUrl}/academics/${p.slug}`, lastmod: p.updatedAt.toISOString().slice(0, 10), priority: '0.8' })),
    ...notices.map(n => ({ loc: `${baseUrl}/notices/${n.slug}`, lastmod: n.updatedAt.toISOString().slice(0, 10), priority: '0.5' })),
    ...events.map(e => ({ loc: `${baseUrl}/events/${e.slug}`, lastmod: e.updatedAt.toISOString().slice(0, 10), priority: '0.6' })),
    ...blogs.map(b => ({ loc: `${baseUrl}/blog/${b.slug}`, lastmod: b.updatedAt.toISOString().slice(0, 10), priority: '0.6' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority || '0.5'}</priority></url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } });
}
