import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const docs = {
    name: 'Metas CMS API',
    version: '4.0.0',
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    auth: { type: 'Bearer', header: 'Authorization: Bearer <api_key>', description: 'Create API keys in Admin → Security → API Keys' },
    endpoints: [
      { method: 'GET', path: '/api/v1/{collection}', description: 'List records', collections: ['programs', 'notices', 'documents', 'faculty', 'events', 'blogs', 'careers'], auth: 'API Key (read scope)' },
      { method: 'GET', path: '/api/health', description: 'Public health check', auth: 'None' },
      { method: 'GET', path: '/sitemap.xml', description: 'Dynamic sitemap per branch', auth: 'None' },
      { method: 'GET', path: '/robots.txt', description: 'Dynamic robots.txt', auth: 'None' },
      { method: 'GET', path: '/manifest.json', description: 'PWA manifest per branch', auth: 'None' },
      { method: 'POST', path: '/api/forms/admissions', description: 'Submit admission inquiry', auth: 'None (rate limited)' },
      { method: 'POST', path: '/api/forms/contact', description: 'Submit contact form', auth: 'None (rate limited)' },
      { method: 'POST', path: '/api/analytics/track', description: 'Track analytics event', auth: 'None (rate limited)' },
    ],
    adminEndpoints: [
      { method: 'GET/POST/PUT/DELETE', path: '/api/admin/cms/{collection}', description: 'CRUD for all CMS collections' },
      { method: 'GET', path: '/api/admin/reports?type={type}', description: 'Custom reports (admissions_by_month, forms_by_source, etc)' },
      { method: 'GET', path: '/api/admin/reports/funnel', description: 'Admission conversion funnel' },
      { method: 'GET', path: '/api/admin/reports/pdf?type={type}', description: 'Printable PDF report' },
      { method: 'POST', path: '/api/admin/workflow', description: 'Content status transitions (draft→review→published)' },
      { method: 'GET/POST/PUT/DELETE', path: '/api/admin/branches', description: 'Branch management' },
      { method: 'POST', path: '/api/admin/branches/clone', description: 'Clone content between branches' },
      { method: 'GET/POST', path: '/api/admin/branches/bulk', description: 'Bulk export/import per branch' },
      { method: 'POST', path: '/api/admin/gdpr', description: 'GDPR data export/deletion' },
      { method: 'POST', path: '/api/admin/ai-assistant', description: 'AI content suggestions' },
      { method: 'GET/PUT', path: '/api/admin/custom-fields', description: 'Custom field definitions' },
      { method: 'GET/POST/DELETE', path: '/api/admin/api-keys', description: 'API key management' },
      { method: 'GET/POST/DELETE', path: '/api/admin/locks', description: 'Collaborative editing locks' },
      { method: 'GET', path: '/api/admin/notifications/stream', description: 'SSE real-time notifications' },
    ],
    cronEndpoints: [
      { method: 'GET', path: '/api/admin/scheduler', description: 'Auto-publish scheduled content', header: 'x-api-secret' },
      { method: 'GET', path: '/api/admin/reminders', description: 'Process follow-up reminders', header: 'x-api-secret' },
      { method: 'GET', path: '/api/admin/retention', description: 'Data retention cleanup', header: 'x-api-secret' },
    ],
  };

  return NextResponse.json(docs, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
