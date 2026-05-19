import { AdminChrome } from '@/components/admin/AdminChrome';
import { SiteSettingsEditor } from '@/components/admin/SiteSettingsEditor';
import { requireAdmin } from '@/lib/admin-auth';
import { getSiteSettings } from '@/lib/cms-db';
import { t, getServerLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function SettingsAdmin() {
  const session = await requireAdmin();
  const locale = await getServerLocale();
  const site = await getSiteSettings();
  return (
    <AdminChrome title={t('settings', locale)} description="" user={session}>
      <SiteSettingsEditor initialSite={site} />
    </AdminChrome>
  );
}
