import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEMPLATES = [
  { id: 'program_standard', name: 'Standard Program Page', collection: 'programs', data: { title: '', category: 'General', status: 'draft', duration: '3 Years', eligibility: '10+2 or equivalent', summary: '', overview: '<p>Program overview goes here.</p>', admissionProcess: '<p>1. Fill application form\n2. Submit documents\n3. Attend counseling</p>', careerOpportunities: '<p>Career paths available after completion.</p>', faqs: ['What is the eligibility?', 'What is the fee structure?', 'Is hostel available?'] } },
  { id: 'notice_circular', name: 'Circular Notice', collection: 'notices', data: { title: '', category: 'Circular', status: 'active', pinned: false, body: '<p>This is to inform all students and staff that...</p>' } },
  { id: 'notice_exam', name: 'Exam Notice', collection: 'notices', data: { title: '', category: 'Examination', status: 'active', pinned: true, body: '<p>The examination schedule for the current semester is as follows:</p>' } },
  { id: 'page_about', name: 'About Page', collection: 'pages', data: { title: 'About Us', status: 'draft', body: '<h2>Our History</h2><p>Founded in...</p><h2>Our Mission</h2><p>To provide...</p><h2>Our Vision</h2><p>To be a leading...</p>' } },
  { id: 'page_contact', name: 'Contact Page', collection: 'pages', data: { title: 'Contact Us', status: 'draft', body: '<h2>Get in Touch</h2><p>Address, phone, email details.</p>' } },
  { id: 'event_seminar', name: 'Seminar Event', collection: 'events', data: { title: '', category: 'Seminar', status: 'draft', summary: 'A seminar on...', body: '<p>Details about the seminar including speakers, schedule, and registration.</p>' } },
  { id: 'blog_announcement', name: 'Announcement Post', collection: 'blogs', data: { title: '', status: 'draft', summary: '', body: '<p>We are pleased to announce...</p>' } },
  { id: 'career_faculty', name: 'Faculty Recruitment', collection: 'careers', data: { title: '', department: '', employmentType: 'Full-time', status: 'draft', description: '<p>Applications are invited for the post of...</p><h3>Qualifications</h3><ul><li>...</li></ul><h3>How to Apply</h3><p>Send resume to...</p>' } },
];

/** GET: list available templates */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  return NextResponse.json({ ok: true, templates: TEMPLATES.map(t => ({ id: t.id, name: t.name, collection: t.collection })) });
}

/** POST: get template data to pre-fill a form */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const { templateId } = await request.json();
  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) return NextResponse.json({ ok: false, error: 'Template not found' }, { status: 404 });
  return NextResponse.json({ ok: true, template });
}
