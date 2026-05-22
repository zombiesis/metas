import { NextResponse } from 'next/server';
import { prisma, dbAvailable } from '@/lib/prisma';
import { resolveBranchByDomain } from '@/lib/tenant';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const h = await headers();
  const host = h.get('host')?.split(':')[0] || 'localhost';
  const branchId = await resolveBranchByDomain(host);

  let name = 'Metas Adventist College';
  let shortName = 'Metas';
  let themeColor = '#071B33';
  let bgColor = '#ffffff';
  let icon = '/assets/images/logos/metas-college-logo.png';

  if (branchId && dbAvailable) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, include: { settings: true } }).catch(() => null);
    if (branch) {
      name = branch.name;
      shortName = branch.slug.charAt(0).toUpperCase() + branch.slug.slice(1);
      if (branch.settings) {
        themeColor = branch.settings.primaryColor;
        if (branch.settings.logo) icon = branch.settings.logo;
      }
    }
  }

  const manifest = {
    name,
    short_name: shortName,
    description: `${name} — Values-Based Higher Education`,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: themeColor,
    background_color: bgColor,
    icons: [
      { src: icon, sizes: '192x192', type: 'image/png' },
      { src: icon, sizes: '512x512', type: 'image/png' },
    ],
    categories: ['education'],
    lang: 'en-IN',
  };

  return NextResponse.json(manifest, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' } });
}
