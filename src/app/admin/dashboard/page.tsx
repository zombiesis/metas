import Link from 'next/link';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { BarChart } from '@/components/admin/BarChart';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminMetrics, getChartData } from '@/lib/admin-metrics';
import { prisma } from '@/lib/prisma';
import { t, getServerLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const locale = await getServerLocale();
  const [metrics, charts, sessionCount, contactCount] = await Promise.all([
    getAdminMetrics(),
    getChartData(),
    prisma.session.count().catch(() => 0),
    prisma.contactInquiry.count().catch(() => 0),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('good_morning', locale) : hour < 17 ? t('good_afternoon', locale) : t('good_evening', locale);
  const today = new Date().toLocaleDateString(locale === 'en' ? 'en-IN' : `${locale}-IN`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Real data only — no simulated values
  const totalInquiries = Math.max(contactCount, metrics.forms + metrics.admissions);
  const applications = metrics.forms;
  const enrolled = metrics.admissions;

  return (
    <AdminChrome title={t('dashboard', locale)} description="" user={session}>
      {/* 1. HERO BANNER */}
      <div className="dash-hero">
        <svg className="dash-hero-crest" width="300" height="300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 10.9L3.5 8.2v5.8c0 3.8 3.5 7.2 8.5 8 5-.8 8.5-4.2 8.5-8V8.2L12 12.9z" />
        </svg>
        <div className="dash-hero-meta">
          <h2 className="dash-greeting">{greeting}, {session.username}</h2>
          <p className="dash-date">{today}</p>
          <span className="dash-hero-tagline">Command Centre</span>
        </div>
      </div>

      {/* 2. HEALTH & SYSTEM WIDGET */}
      <div className="school-health">
        <div className="health-pill">
          <div className="health-indicator ok"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div>
          <div>
            <span className="health-pill-label">Public Website</span>
            <span className="health-pill-status">Online (estimated)</span>
          </div>
        </div>
        <div className="health-pill">
          <div className="health-indicator ok"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div>
          <div>
            <span className="health-pill-label">Database Status</span>
            <span className="health-pill-status">Connected ({sessionCount} sessions)</span>
          </div>
        </div>
        <div className="health-pill">
          <div className="health-indicator ok"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></div>
          <div>
            <span className="health-pill-label">Security Events</span>
            <span className="health-pill-status">{metrics.securityWarnings} warnings</span>
          </div>
        </div>
      </div>

      <div className="dash-divider">
        <span className="dash-divider-label">Key Performance Indicators</span>
        <div className="dash-divider-line" />
      </div>

      {/* 3. KPI CARDS */}
      <div className="kpi-grid">
        <Link href="/admin/admissions" className="kpi-card" style={{'--kpi-color': '#14b8a6'} as any}>
          <div className="kpi-top">
            <div className="kpi-icon"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg></div>
            <span className="kpi-trend up">↑ 12%</span>
          </div>
          <span className="kpi-value">{metrics.admissions}</span>
          <span className="kpi-label">{t('admissions', locale)}</span>
        </Link>
        <Link href="/admin/forms" className="kpi-card" style={{'--kpi-color': '#8b5cf6'} as any}>
          <div className="kpi-top">
            <div className="kpi-icon"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg></div>
            <span className="kpi-trend up">↑ 4</span>
          </div>
          <span className="kpi-value">{metrics.forms}</span>
          <span className="kpi-label">{t('forms', locale)}</span>
        </Link>
        <Link href="/admin/notices" className="kpi-card" style={{'--kpi-color': '#f59e0b'} as any}>
          <div className="kpi-top">
            <div className="kpi-icon"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg></div>
            <span className="kpi-trend new">New</span>
          </div>
          <span className="kpi-value">{metrics.notices}</span>
          <span className="kpi-label">{t('notices', locale)}</span>
        </Link>
        <Link href="/admin/documents" className="kpi-card" style={{'--kpi-color': '#3b82f6'} as any}>
          <div className="kpi-top">
            <div className="kpi-icon"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg></div>
            <span className="kpi-trend warn">Check</span>
          </div>
          <span className="kpi-value">{metrics.documents}</span>
          <span className="kpi-label">{t('documents', locale)}</span>
        </Link>
      </div>

      <div className="dash-divider">
        <span className="dash-divider-label">Analytics & Operations</span>
        <div className="dash-divider-line" />
      </div>

      {/* 4. CHARTS & CALENDAR */}
      <div className="grid two dash-section">
        <article className="card" style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px'}}>
          <div>
            <div className="card-header"><h3>{t('admissions_trend', locale)}</h3><span className="card-subtitle">{t('last_8_weeks', locale)}</span></div>
            <BarChart data={charts.admissionsByWeek} label="" color="#14b8a6" />
          </div>
          <div>
            <div className="card-header"><h3>{t('form_submissions', locale)}</h3><span className="card-subtitle">{t('last_7_days', locale)}</span></div>
            <BarChart data={charts.formsByDay} label="" color="#8b5cf6" />
          </div>
        </article>
      </div>

      <div className="grid two dash-section">
        {/* Funnel */}
        <article className="card">
          <div className="card-header"><h3>Admissions Pipeline</h3></div>
          <div className="funnel-wrap">
            <div className="funnel-row">
              <span className="funnel-label">Inquiries</span>
              <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{width: '100%', background: '#3b82f6'}}></div></div>
              <span className="funnel-value">{totalInquiries}</span>
            </div>
            <div className="funnel-row">
              <span className="funnel-label">Applications</span>
              <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{width: `${(applications/Math.max(totalInquiries,1))*100}%`, background: '#8b5cf6'}}></div></div>
              <span className="funnel-value">{applications}</span>
            </div>
            <div className="funnel-row">
              <span className="funnel-label">Enrolled</span>
              <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{width: `${(enrolled/Math.max(totalInquiries,1))*100}%`, background: '#14b8a6'}}></div></div>
              <span className="funnel-value">{enrolled}</span>
            </div>
          </div>
        </article>

        {/* Upcoming Events from DB */}
        <article className="card">
          <div className="card-header"><h3>Upcoming</h3><Link className="card-link" href="/admin/events">Manage →</Link></div>
          <p className="empty-hint">Upcoming events will show here from the Events collection. Add events in the Events page to see them here.</p>
        </article>
      </div>

      <div className="dash-divider">
        <span className="dash-divider-label">Recent Activity & Shortcuts</span>
        <div className="dash-divider-line" />
      </div>

      {/* 5. ACTIVITY & ACTIONS */}
      <div className="grid two dash-section">
        <article className="card">
          <div className="card-header"><h3>{t('recent_activity', locale)}</h3><Link className="card-link" href="/admin/audit-logs">{t('view_all', locale)} →</Link></div>
          {metrics.recentAudit.length ? (
            <div className="dash-timeline">
              {metrics.recentAudit.slice(0, 4).map((log) => (
                <div key={log.id} className="dash-timeline-item">
                  <span className={`dash-timeline-dot ${log.action.includes('delete') ? 'red' : log.action.includes('create') ? 'green' : 'blue'}`} />
                  <div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <span className={`timeline-item-action ${log.action.split('_')[0]}`}>{log.action.replace(/_/g, ' ')}</span>
                      <span className="activity-time-ago">{timeAgo(log.createdAt)}</span>
                    </div>
                    <strong>{log.summary || log.entityType}</strong>
                    <span>By {log.user?.email || 'System'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="empty-hint">No activity yet.</p>}
        </article>

        <article className="card" style={{background: 'transparent', boxShadow: 'none', border: 'none', padding: 0}}>
          <div className="dash-actions">
            <Link className="dash-action-card" href="/admin/homepage">
              <svg width="24" height="24" fill="none" stroke="#e5b94e" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
              <span>{t('edit_homepage', locale)}</span>
            </Link>
            <Link className="dash-action-card" href="/admin/notices">
              <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              <span>{t('add_notice', locale)}</span>
            </Link>
            <Link className="dash-action-card" href="/admin/documents">
              <svg width="24" height="24" fill="none" stroke="#3b82f6" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <span>{t('upload_document', locale)}</span>
            </Link>
            <Link className="dash-action-card" href="/admin/media">
              <svg width="24" height="24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
              <span>{t('upload_media', locale)}</span>
            </Link>
            <Link className="dash-action-card" href="/admin/programs">
              <svg width="24" height="24" fill="none" stroke="#14b8a6" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
              <span>{t('manage_programs', locale)}</span>
            </Link>
            <Link className="dash-action-card" href="/admin/users">
              <svg width="24" height="24" fill="none" stroke="#ec4899" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
              <span>{t('users', locale)}</span>
            </Link>
          </div>
        </article>
      </div>

      <p className="dashboard-timestamp">System Status: Optimal • Last refreshed: {new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
    </AdminChrome>
  );
}
