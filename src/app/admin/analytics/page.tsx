import { AdminChrome } from '@/components/admin/AdminChrome';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { t, getServerLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

function countBy<T extends string | null>(values: T[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value || '(unknown)', (counts.get(value || '(unknown)') || 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
}

export default async function AnalyticsAdmin() {
  const session = await requireAdmin();
  const locale = await getServerLocale();
  const events = await prisma.analyticsEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 2000 }).catch(() => []);
  const submissions = await prisma.formSubmission.count().catch(() => 0);
  const leads = await prisma.admissionLead.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }).catch(() => []);
  const eventCounts = countBy(events.map((event) => event.event));
  const pageCounts = countBy(events.map((event) => event.path));
  const programCounts = countBy(leads.map((lead) => lead.program));
  return (
    <AdminChrome title={t('analytics', locale)} description="" user={session}>
      <div className="admin-metrics">
        <article className="card metric"><span>Total events</span><strong>{events.length}</strong></article>
        <article className="card metric"><span>{t('forms', locale)}</span><strong>{submissions}</strong></article>
        <article className="card metric"><span>{t('admissions', locale)}</span><strong>{leads.length}</strong></article>
        <article className="card metric"><span>{t('programs', locale)}</span><strong>{programCounts.length}</strong></article>
      </div>
      <div className="grid three">
        <article className="card"><h2>{t('top_events', locale)}</h2>{eventCounts.length ? <ul>{eventCounts.map(([name, count]) => <li key={name}><b>{name}</b> — {count}</li>)}</ul> : <p>No events yet.</p>}</article>
        <article className="card"><h2>Top pages</h2>{pageCounts.length ? <ul>{pageCounts.map(([name, count]) => <li key={name}><b>{name}</b> — {count}</li>)}</ul> : <p>No page views yet.</p>}</article>
        <article className="card"><h2>{t('programs', locale)}</h2>{programCounts.length ? <ul>{programCounts.map(([name, count]) => <li key={name}><b>{name}</b> — {count}</li>)}</ul> : <p>No admissions leads yet.</p>}</article>
      </div>
    </AdminChrome>
  );
}
