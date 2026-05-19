import { AdminChrome } from '@/components/admin/AdminChrome';
import { AdminCrudClient } from '@/components/admin/AdminCrudClient';
import { MediaUploader } from '@/components/admin/MediaUploader';
import { requireAdmin } from '@/lib/admin-auth';
import { listUploads, readCMSCollection } from '@/lib/cms-db';
import { t, getServerLocale } from '@/lib/i18n';
import { getAdminCollectionConfig } from '@/lib/admin-fields';

export const dynamic = 'force-dynamic';

export default async function AdminMedia() {
  const session = await requireAdmin();
  const locale = await getServerLocale();
  const [uploads, media] = await Promise.all([listUploads(), readCMSCollection<any[]>('media')]);
  const config = getAdminCollectionConfig('media')!;
  return (
    <AdminChrome title={t('media', locale)} description="" user={session}>
      <div className="admin-media-grid">
        <div className="card">
          <h2>Upload</h2>
          <MediaUploader />
        </div>
        <div className="card">
          <h2>Recent Uploads</h2>
          <div className="media-list">
            {uploads.slice(0, 8).map((file) => <a key={file.url} href={file.url} target="_blank" rel="noreferrer"><strong>{file.name}</strong><small>{file.url}</small></a>)}
            {!uploads.length ? <p className="empty-hint">No uploaded files yet. Drag files above to upload.</p> : null}
          </div>
        </div>
      </div>
      <AdminCrudClient config={config} initialRecords={JSON.parse(JSON.stringify(media))} />
    </AdminChrome>
  );
}
