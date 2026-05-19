import { AdminChrome } from '@/components/admin/AdminChrome';
import { AdminCrudClient } from '@/components/admin/AdminCrudClient';
import { TwoFactorSetup } from '@/components/admin/TwoFactorSetup';
import { PasswordChangeForm } from '@/components/admin/PasswordChangeForm';
import { SessionManager } from '@/components/admin/SessionManager';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminCollectionConfig } from '@/lib/admin-fields';
import { prisma } from '@/lib/prisma';
import { t, getServerLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const checklist = [
  'Cloudflare WAF enabled in production',
  'Cloudflare DDoS protection and bot mitigation enabled',
  'Admin route protected with WAF rule /admin* and /api/admin*',
  'Turnstile/CAPTCHA configured on public forms',
  'Origin shield / CDN caching for static assets',
  'Upload endpoint size and type limits enabled',
  'HTTPS and HSTS enabled',
  'Daily database and media backups configured',
  'Security headers enabled through middleware',
  'Admin users reviewed and least-privilege roles assigned'
];

export default async function SecurityAdmin() {
  const session = await requireAdmin();
  const locale = await getServerLocale();
  const [events, users, sessions, currentUser] = await Promise.all([
    prisma.securityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { user: true } }).catch(() => []),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { role: true } }).catch(() => []),
    prisma.session.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { user: true } }).catch(() => []),
    prisma.user.findUnique({ where: { id: session.userId }, select: { totpEnabled: true } })
  ]);
  const warnings = events.filter((event) => ['warning', 'critical'].includes(event.severity)).length;
  return (
    <AdminChrome title={t('security', locale)} description="" user={session}>
      <div className="admin-metrics">
        <article className="card metric"><span>Security events</span><strong>{events.length}</strong></article>
        <article className="card metric"><span>Warnings</span><strong>{warnings}</strong></article>
        <article className="card metric"><span>Admin users</span><strong>{users.length}</strong></article>
        <article className="card metric"><span>Active sessions</span><strong>{sessions.length}</strong></article>
      </div>
      <div className="grid two">
        <article className="card"><h2>Two-Factor Authentication</h2><TwoFactorSetup enabled={currentUser?.totpEnabled ?? false} /></article>
        <article className="card"><h2>Change Password</h2><PasswordChangeForm /></article>
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <article className="card"><h2>Active Sessions</h2><SessionManager /></article>
        <article className="card"><h2>WAF / DDoS checklist</h2><ul>{checklist.map((item) => <li key={item}>{item}</li>)}</ul><p className="required">Application rate limiting helps, but network-layer DDoS protection must be handled by Cloudflare or an equivalent WAF/CDN layer.</p></article>
      </div>
      <div style={{ marginTop: 24 }}>
        <AdminCrudClient config={getAdminCollectionConfig('security-events')!} initialRecords={JSON.parse(JSON.stringify(events))} />
      </div>
    </AdminChrome>
  );
}
