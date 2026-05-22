import Link from 'next/link';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { BarChart } from '@/components/admin/BarChart';
import { requireAdmin } from '@/lib/admin-auth';
import { requireDb } from '@/lib/prisma';
import { scopedWhere } from '@/lib/prisma-tenant';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const prisma = requireDb();
  const session = await requireAdmin();
  const w = await scopedWhere();

  const [totalLeads, totalForms, totalContacts, enrolled] = await Promise.all([
    prisma.admissionLead.count({ where: w }).catch(() => 0),
    prisma.formSubmission.count({ where: w }).catch(() => 0),
    prisma.contactInquiry.count({ where: w }).catch(() => 0),
    prisma.admissionLead.count({ where: { ...w, status: 'enrolled' } }).catch(() => 0),
  ]);

  const conversionRate = totalLeads ? ((enrolled / totalLeads) * 100).toFixed(1) : '0';

  // Monthly admissions for chart
  const now = new Date();
  const monthlyData = await Promise.all(Array.from({ length: 6 }, (_, i) => {
    const idx = 5 - i;
    const start = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - idx + 1, 1);
    return prisma.admissionLead.count({ where: { ...w, createdAt: { gte: start, lt: end } } }).catch(() => 0)
      .then(value => ({ label: start.toLocaleDateString('en-IN', { month: 'short' }), value }));
  }));

  return (
    <AdminChrome title="Analytics & Reports" description="Insights and reporting" user={session}>
      <div className="kpi-grid">
        <div className="kpi-card"><span className="kpi-value">{totalLeads}</span><span className="kpi-label">Total Leads</span></div>
        <div className="kpi-card"><span className="kpi-value">{totalForms}</span><span className="kpi-label">Form Submissions</span></div>
        <div className="kpi-card"><span className="kpi-value">{enrolled}</span><span className="kpi-label">Enrolled</span></div>
        <div className="kpi-card"><span className="kpi-value">{conversionRate}%</span><span className="kpi-label">Conversion Rate</span></div>
      </div>

      <div className="grid two dash-section">
        <article className="card">
          <div className="card-header"><h3>Admissions (6 months)</h3></div>
          <BarChart data={monthlyData} label="" color="#14b8a6" />
        </article>
        <article className="card">
          <div className="card-header"><h3>Reports</h3></div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Link className="btn outline" href="/api/admin/reports?type=admissions_by_month">Admissions by Month (JSON)</Link>
            <Link className="btn outline" href="/api/admin/reports?type=admissions_by_program">By Program (JSON)</Link>
            <Link className="btn outline" href="/api/admin/reports?type=forms_by_source">Forms by Source (JSON)</Link>
            <Link className="btn outline" href="/api/admin/reports/funnel">Admission Funnel (JSON)</Link>
            <Link className="btn outline" href="/api/admin/reports/pageviews">Page Views (JSON)</Link>
            <Link className="btn gold" href="/api/admin/reports/pdf?type=admissions" target="_blank">📄 Admissions PDF</Link>
            <Link className="btn gold" href="/api/admin/reports/pdf?type=forms" target="_blank">📄 Forms PDF</Link>
          </div>
        </article>
      </div>
    </AdminChrome>
  );
}
