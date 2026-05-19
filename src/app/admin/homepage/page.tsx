import { AdminChrome } from '@/components/admin/AdminChrome';
import { HomepageEditorClient } from '@/components/admin/HomepageEditorClient';
import { requireAdmin } from '@/lib/admin-auth';
import { getHomepageSections } from '@/lib/cms-db';
import { t, getServerLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function HomepageAdmin() {
  const session = await requireAdmin();
  const locale = await getServerLocale();
  const sections = await getHomepageSections();
  return (
    <AdminChrome title={t('homepage', locale)} description="" user={session}>
      <HomepageEditorClient initialSections={JSON.parse(JSON.stringify(sections))} />
    </AdminChrome>
  );
}
