import { AdminChrome } from '@/components/admin/AdminChrome';
import { PluginManager } from '@/components/admin/PluginManager';
import { requireAdmin } from '@/lib/admin-auth';
import { t, getServerLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function PluginsPage() {
  const session = await requireAdmin();
  const locale = await getServerLocale();
  return (
    <AdminChrome title={t('plugins', locale)} description="" user={session}>
      <PluginManager />
    </AdminChrome>
  );
}
