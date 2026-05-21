import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';
import { can } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: Generate a simple HTML report (printable as PDF via browser) */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'export')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const branchId = await getCurrentBranchId();
  const w = branchId ? { branchId } : {};
  const type = request.nextUrl.searchParams.get('type') || 'admissions';

  let title = 'Report';
  let rows: string[][] = [];
  let headers: string[] = [];

  switch (type) {
    case 'admissions': {
      title = 'Admissions Report';
      headers = ['Name', 'Phone', 'Email', 'Program', 'Status', 'Date'];
      const leads = await prisma.admissionLead.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 200 });
      rows = leads.map(l => [l.studentName, l.phone, l.email || '-', l.program || '-', l.status, l.createdAt.toLocaleDateString('en-IN')]);
      break;
    }
    case 'forms': {
      title = 'Form Submissions Report';
      headers = ['Kind', 'Name', 'Phone', 'Email', 'Status', 'Date'];
      const forms = await prisma.formSubmission.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 200 });
      rows = forms.map(f => [f.kind, f.name || '-', f.phone || '-', f.email || '-', f.status, f.createdAt.toLocaleDateString('en-IN')]);
      break;
    }
    case 'content': {
      title = 'Content Summary Report';
      headers = ['Type', 'Count'];
      const [pages, programs, notices, faculty] = await Promise.all([
        prisma.page.count({ where: { ...w, status: 'published' } }),
        prisma.program.count({ where: { ...w, status: 'published' } }),
        prisma.notice.count({ where: { ...w, status: 'active' } }),
        prisma.faculty.count({ where: { ...w, status: 'published' } }),
      ]);
      rows = [['Pages', String(pages)], ['Programs', String(programs)], ['Notices', String(notices)], ['Faculty', String(faculty)]];
      break;
    }
  }

  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:Inter,sans-serif;margin:40px;color:#333}h1{color:#071B33;border-bottom:2px solid #C7A45B;padding-bottom:8px}
table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}
th{background:#071B33;color:#fff}tr:nth-child(even){background:#f9f9f9}.meta{color:#666;font-size:0.85rem;margin-top:8px}
@media print{body{margin:20px}}</style></head>
<body><h1>${title}</h1><p class="meta">Generated: ${date} | Branch: ${branchId || 'All'} | By: ${auth.session!.username}</p>
<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
<p class="meta">${rows.length} records | Use Ctrl+P to print/save as PDF</p></body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
