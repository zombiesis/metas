import { notFound } from 'next/navigation';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { BranchThemeEditor } from '@/components/admin/BranchThemeEditor';
import { BranchFeatureFlags } from '@/components/admin/BranchFeatureFlags';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export default async function BranchThemePage({ params }: { params: Params }) {
  const session = await requireAdmin();
  const { id } = await params;
  const branch = await prisma.branch.findUnique({ where: { id }, include: { settings: true } });
  if (!branch) notFound();

  const settings = (branch.settings || { primaryColor: '#071B33', accentColor: '#C7A45B', fontHeading: 'Playfair Display', fontBody: 'Inter' }) as any;
  let features: Record<string, boolean> = {};
  try { features = JSON.parse(settings.features || '{}'); } catch {}

  return (
    <AdminChrome title={`Theme: ${branch.name}`} description="Customize branding and features for this branch" user={session}>
      <BranchThemeEditor branchId={id} initial={{ logo: settings.logo || undefined, favicon: settings.favicon || undefined, primaryColor: settings.primaryColor, accentColor: settings.accentColor, fontHeading: settings.fontHeading, fontBody: settings.fontBody, tagline: settings.tagline || undefined, footerText: settings.footerText || undefined, customCss: settings.customCss || undefined }} />
      <div style={{ marginTop: 24 }}>
        <BranchFeatureFlags branchId={id} initial={features} />
      </div>
    </AdminChrome>
  );
}
