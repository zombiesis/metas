import { prisma } from '@/lib/prisma';

function weekLabel(weeksAgo: number) {
  const d = new Date(Date.now() - weeksAgo * 7 * 86400000);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function dayLabel(daysAgo: number) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.now() - daysAgo * 86400000).getDay()];
}

export async function getChartData() {
  const now = Date.now();

  const [admissionsByWeek, formsByDay] = await Promise.all([
    Promise.all(Array.from({ length: 8 }, (_, idx) => {
      const i = 7 - idx;
      const start = new Date(now - (i + 1) * 7 * 86400000);
      const end = new Date(now - i * 7 * 86400000);
      return prisma.admissionLead.count({ where: { createdAt: { gte: start, lt: end } } }).catch(() => 0).then((value) => ({ label: weekLabel(i), value }));
    })),
    Promise.all(Array.from({ length: 7 }, (_, idx) => {
      const i = 6 - idx;
      const start = new Date(now - (i + 1) * 86400000);
      const end = new Date(now - i * 86400000);
      return prisma.formSubmission.count({ where: { createdAt: { gte: start, lt: end } } }).catch(() => 0).then((value) => ({ label: dayLabel(i), value }));
    })),
  ]);

  return { admissionsByWeek, formsByDay };
}

export async function getAdminMetrics() {
  const [
    admissions,
    forms,
    notices,
    draftPages,
    documents,
    users,
    failedLogins,
    securityWarnings,
    analytics,
    recentAudit
  ] = await Promise.all([
    prisma.admissionLead.count().catch(() => 0),
    prisma.formSubmission.count().catch(() => 0),
    prisma.notice.count({ where: { status: { not: 'archived' } } }).catch(() => 0),
    prisma.page.count({ where: { status: 'draft' } }).catch(() => 0),
    prisma.document.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.securityEvent.count({ where: { event: { contains: 'failed_login' } } }).catch(() => 0),
    prisma.securityEvent.count({ where: { severity: { in: ['warning', 'critical'] } } }).catch(() => 0),
    prisma.analyticsEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => []),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: true } }).catch(() => [])
  ]);
  const topEvents = analytics.reduce<Record<string, number>>((acc, item) => { acc[item.event] = (acc[item.event] || 0) + 1; return acc; }, {});
  const topPages = analytics.filter((a) => a.path).reduce<Record<string, number>>((acc, item) => { acc[item.path!] = (acc[item.path!] || 0) + 1; return acc; }, {});
  return {
    admissions,
    forms,
    notices,
    draftPages,
    documents,
    users,
    failedLogins,
    securityWarnings,
    topEvents: Object.entries(topEvents).sort((a, b) => b[1] - a[1]).slice(0, 8),
    topPages: Object.entries(topPages).sort((a, b) => b[1] - a[1]).slice(0, 8),
    recentAudit
  };
}
