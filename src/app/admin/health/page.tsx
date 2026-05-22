import { AdminChrome } from '@/components/admin/AdminChrome';
import { requireAdmin } from '@/lib/admin-auth';
import { requireDb } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const prisma = requireDb();
  const session = await requireAdmin();
  const start = Date.now();

  const [dbOk, userCount, sessionCount, branchCount, eventCount, storageFiles] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    prisma.user.count().catch(() => 0),
    prisma.session.count().catch(() => 0),
    prisma.branch.count().catch(() => 0),
    prisma.analyticsEvent.count().catch(() => 0),
    prisma.mediaAsset.count().catch(() => 0),
  ]);

  const latency = Date.now() - start;
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  return (
    <AdminChrome title="System Health" description="Infrastructure monitoring" user={session}>
      <div className="kpi-grid">
        <div className="kpi-card"><span className="kpi-value" style={{ color: dbOk ? '#10b981' : '#ef4444' }}>{dbOk ? '✓' : '✗'}</span><span className="kpi-label">Database</span></div>
        <div className="kpi-card"><span className="kpi-value">{latency}ms</span><span className="kpi-label">DB Latency</span></div>
        <div className="kpi-card"><span className="kpi-value">{Math.floor(uptime / 3600)}h</span><span className="kpi-label">Uptime</span></div>
        <div className="kpi-card"><span className="kpi-value">{Math.round(memory.heapUsed / 1024 / 1024)}MB</span><span className="kpi-label">Memory</span></div>
      </div>

      <div className="grid two dash-section">
        <article className="card">
          <h3>System Stats</h3>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr><td>Users</td><td><strong>{userCount}</strong></td></tr>
              <tr><td>Active Sessions</td><td><strong>{sessionCount}</strong></td></tr>
              <tr><td>Branches</td><td><strong>{branchCount}</strong></td></tr>
              <tr><td>Analytics Events</td><td><strong>{eventCount.toLocaleString()}</strong></td></tr>
              <tr><td>Media Files</td><td><strong>{storageFiles}</strong></td></tr>
              <tr><td>Node.js</td><td><strong>{process.version}</strong></td></tr>
              <tr><td>Platform</td><td><strong>{process.platform}</strong></td></tr>
            </tbody>
          </table>
        </article>
        <article className="card">
          <h3>Cron Endpoints</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Call these via cron with <code>x-api-secret</code> header:</p>
          <ul style={{ fontSize: '0.85rem' }}>
            <li><code>/api/admin/scheduler</code> — Auto-publish (every 1min)</li>
            <li><code>/api/admin/reminders</code> — Follow-up reminders (every 15min)</li>
            <li><code>/api/admin/retention</code> — Data cleanup (daily)</li>
          </ul>
        </article>
      </div>
    </AdminChrome>
  );
}
