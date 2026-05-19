import { AdminChrome } from '@/components/admin/AdminChrome';
import { AdminCrudClient } from '@/components/admin/AdminCrudClient';
import { requireAdmin } from '@/lib/admin-auth';
import { assertCollection, readAdminCollection } from '@/lib/cms-db';
import { getAdminCollectionConfig } from '@/lib/admin-fields';
import { t, getServerLocale } from '@/lib/i18n';

export async function AdminCollectionServer({ collection }: { collection: string }) {
  const session = await requireAdmin();
  const locale = await getServerLocale();
  const col = assertCollection(collection);
  const config = getAdminCollectionConfig(col);
  if (!config) throw new Error(`No admin configuration for ${col}`);
  const records = await readAdminCollection<any[]>(col);
  const serializable = JSON.parse(JSON.stringify(records));
  const title = t(col.replace(/-/g, '_'), locale) || config.title;
  return (
    <AdminChrome title={title} description={config.description} user={session}>
      <AdminCrudClient config={config} initialRecords={serializable} />
    </AdminChrome>
  );
}
