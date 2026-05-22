import { AdminChrome } from '@/components/admin/AdminChrome';
import { requireAdmin } from '@/lib/admin-auth';
import { requireDb } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PageVersions() {
  const prisma = requireDb();
  const session = await requireAdmin();
  const versions = await prisma.pageVersion.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { page: true } }).catch(() => []);
  return (
    <AdminChrome title="Page Version History" description="Restore earlier page snapshots as drafts." user={session}>
      <div className="card">
        <table className="admin-table"><thead><tr><th>Page</th><th>Version</th><th>Created</th><th>Restore</th></tr></thead><tbody>
          {versions.map((version) => <tr key={version.id}><td>{version.page.title}</td><td>{version.version}</td><td>{version.createdAt.toISOString()}</td><td><form method="post" action="/api/admin/pages/restore"><input type="hidden" name="versionId" value={version.id} /><button className="btn outline">Restore as draft</button></form></td></tr>)}
          {!versions.length ? <tr><td colSpan={4}>No versions yet. Edit and save a page to create history.</td></tr> : null}
        </tbody></table>
      </div>
    </AdminChrome>
  );
}
