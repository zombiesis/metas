import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
const root = process.cwd();
const cmsRoot = path.join(root, 'content', 'cms');

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(cmsRoot, `${name}.json`), 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function seedRolesAndUsers() {
  const permissions = ['view', 'create', 'edit', 'delete', 'publish', 'archive', 'export', 'manage_users', 'view_analytics', 'view_audit_logs', 'manage_security'];
  for (const key of permissions) await prisma.permission.upsert({ where: { key }, create: { key, description: key.replace(/_/g, ' ') }, update: {} });
  const roleMatrix: Record<string, string[]> = {
    'Super Admin': permissions,
    'Principal': permissions.filter((p) => p !== 'manage_security'),
    'Admissions Manager': ['view', 'create', 'edit', 'publish', 'archive', 'export', 'view_analytics'],
    'Placement Officer': ['view', 'create', 'edit', 'publish', 'archive', 'export', 'view_analytics'],
    'IQAC Coordinator': ['view', 'create', 'edit', 'publish', 'archive', 'export', 'view_audit_logs'],
    'Faculty Editor': ['view', 'create', 'edit'],
    'Media Editor': ['view', 'create', 'edit', 'delete', 'publish', 'archive'],
    'HR Manager': ['view', 'create', 'edit', 'publish', 'archive', 'export'],
    'Viewer': ['view']
  };
  for (const [name, keys] of Object.entries(roleMatrix)) {
    const role = await prisma.role.upsert({ where: { name }, create: { name, description: `${name} permissions` }, update: { description: `${name} permissions` } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const key of keys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
    }
  }
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: 'Super Admin' } });
    await prisma.user.create({
      data: {
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@metasofsda.in',
        name: 'Website Administrator',
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'metas-admin-change-me', 12),
        roleId: role.id
      }
    });
  }
}

async function seedContent() {
  const site = await readJson<any>('site', {});
  await prisma.siteSetting.upsert({ where: { key_branchId: { key: 'site', branchId: '' } }, create: { key: 'site', label: 'Site settings', group: 'global', value: JSON.stringify(site) }, update: { value: JSON.stringify(site) } });

  const pages = await readJson<Record<string, any>>('pages', {});
  for (const [slug, page] of Object.entries(pages)) {
    await prisma.page.upsert({
      where: { slug_branchId: { slug, branchId: '' } },
      create: { slug, title: page.title || page.heroTitle || slug, summary: page.summary || page.welcomeTitle || page.heroSubtitle || '', body: page.body || page.overview || page.welcomeBody || '', status: 'published', seoTitle: page.seoTitle || null, seoDescription: page.seoDescription || null, metadata: JSON.stringify(page) },
      update: { title: page.title || page.heroTitle || slug, summary: page.summary || page.welcomeTitle || page.heroSubtitle || '', body: page.body || page.overview || page.welcomeBody || '', metadata: JSON.stringify(page) }
    });
  }

  const home = pages.home || {};
  const sections = [
    ['topbar', 'All contacts, office hours, and quick links', '', '', 1, { editable: 'Use Site Settings for contacts.' }],
    ['header', 'Sticky header and mega menu', '', '', 2, { editable: 'Use Site Settings navigation.' }],
    ['hero', home.heroTitle || 'Metas Adventist College, Surat', home.heroSubtitle || 'Values-based higher education for academic excellence, professional growth, service, and leadership.', '', 3, { primaryCta: 'Apply Now', secondaryCta: 'Admission Enquiry 2026-27', tertiaryCta: 'Explore Programs' }],
    ['notices', 'Dynamic notice bar', 'Admissions, exams, results, newsletters, jobs, and placement drives.', '', 4, {}],
    ['welcome', home.welcomeTitle || 'A disciplined, service-minded college experience in the heart of Surat.', '', home.welcomeBody || '', 5, {}],
    ['mission', 'Teaching, healing, and creating a better community.', '', '', 6, {}],
    ['programs', 'Verified programs and value-added learning resources.', '', '', 7, {}],
    ['why', 'Trust, clarity, compliance, and conversion-focused admissions.', '', '', 8, { items: home.whyChoose || [] }],
    ['stats', 'No fake counters. No invented numbers.', '', 'Verified data to be updated.', 9, {}],
    ['admissions', 'One high-converting enquiry path for every student.', '', '', 10, {}],
    ['placements', 'Recruiter-ready placement, internship, and preparation paths.', '', pages.placements?.summary || '', 11, {}],
    ['faculty', 'Verified faculty details only.', '', '', 12, {}],
    ['infrastructure', 'Image-rich facility cards with corrected naming.', '', '', 13, {}],
    ['accreditation', 'Searchable document center for trust and compliance.', '', '', 14, {}],
    ['news', 'Current news, real testimonials only, premium footer.', '', '', 15, {}],
    ['testimonials', 'Testimonials', '', home.testimonialsNote || 'Testimonials to be added by admin.', 16, {}],
    ['footer', 'Premium footer', '', 'Brand, links, programs, contact, map, and copyright only.', 17, {}]
  ] as const;
  for (const [key, title, subtitle, body, order, settings] of sections) {
    await prisma.homepageSection.upsert({ where: { key_branchId: { key, branchId: '' } }, create: { key, title, subtitle, body, order, visible: true, status: 'published', settings: JSON.stringify(settings) }, update: { title, subtitle, body, order, visible: true, status: 'published', settings: JSON.stringify(settings) } });
  }

  const programs = await readJson<any[]>('programs', []);
  for (const p of programs) {
    await prisma.program.upsert({
      where: { slug_branchId: { slug: p.slug, branchId: '' } },
      create: { title: p.title, slug: p.slug, category: p.category || 'General', status: p.status || 'draft', duration: p.duration || null, eligibility: p.eligibility || null, summary: p.summary || null, overview: p.overview || null, authorityNote: p.authorityNote || null, admissionProcess: p.admissionProcess || null, attendanceRules: p.attendanceRules || null, semesterStructure: p.semesterStructure || null, careerOpportunities: p.careerOpportunities || null, faqs: JSON.stringify(p.faqs || []), rules: JSON.stringify(p.rules || []), documents: JSON.stringify(p.documents || []), facultyIds: JSON.stringify(p.facultyIds || []), image: p.image || null, seoTitle: p.seoTitle || null, seoDescription: p.seoDescription || null },
      update: { title: p.title, category: p.category || 'General', status: p.status || 'draft', duration: p.duration || null, eligibility: p.eligibility || null, summary: p.summary || null, overview: p.overview || null, authorityNote: p.authorityNote || null, admissionProcess: p.admissionProcess || null, attendanceRules: p.attendanceRules || null, semesterStructure: p.semesterStructure || null, careerOpportunities: p.careerOpportunities || null, faqs: JSON.stringify(p.faqs || []), rules: JSON.stringify(p.rules || []), documents: JSON.stringify(p.documents || []), facultyIds: JSON.stringify(p.facultyIds || []), image: p.image || null, seoTitle: p.seoTitle || null, seoDescription: p.seoDescription || null }
    });
  }

  const faculty = await readJson<any[]>('faculty', []);
  for (const f of faculty) {
    await prisma.faculty.upsert({
      where: { slug_branchId: { slug: f.slug || slugify(f.name), branchId: '' } },
      create: { name: f.name, slug: f.slug || slugify(f.name), department: f.department || null, qualification: f.qualification || null, designation: f.designation || null, photo: f.photo || null, experience: f.experience || null, expertise: f.expertise || null, bio: f.bio || f.verification || null, publications: JSON.stringify(f.publications || []), contactEmail: f.contactEmail || null, contactPhone: f.contactPhone || null, contactVisible: Boolean(f.contactVisible), spotlight: Boolean(f.spotlight), status: f.status || 'published' },
      update: { name: f.name, department: f.department || null, qualification: f.qualification || null, designation: f.designation || null, photo: f.photo || null, experience: f.experience || null, expertise: f.expertise || null, bio: f.bio || f.verification || null, publications: JSON.stringify(f.publications || []), contactEmail: f.contactEmail || null, contactPhone: f.contactPhone || null, contactVisible: Boolean(f.contactVisible), spotlight: Boolean(f.spotlight), status: f.status || 'published' }
    });
  }

  const notices = await readJson<any[]>('notices', []);
  for (const n of notices) {
    const slug = n.slug || slugify(n.title);
    await prisma.notice.upsert({
      where: { slug_branchId: { slug, branchId: '' } },
      create: { title: n.title, slug, category: n.category || 'General', date: parseDate(n.date), expiryDate: parseDate(n.expiryDate), status: n.status || 'active', program: n.program || null, externalUrl: n.url || null, documentUrl: n.documentUrl || null, body: n.body || null, pinned: Boolean(n.pinned) },
      update: { title: n.title, category: n.category || 'General', date: parseDate(n.date), expiryDate: parseDate(n.expiryDate), status: n.status || 'active', program: n.program || null, externalUrl: n.url || null, documentUrl: n.documentUrl || null, body: n.body || null, pinned: Boolean(n.pinned) }
    });
  }

  const documents = await readJson<any[]>('documents', []);
  for (const d of documents) {
    await prisma.document.upsert({
      where: { slug_branchId: { slug: d.slug || slugify(d.title), branchId: '' } },
      create: { title: d.title, slug: d.slug || slugify(d.title), category: d.category || null, authority: d.authority || 'Internal', documentType: d.documentType || 'Document', year: d.year || null, academicYear: d.academicYear || null, program: d.program || null, description: d.description || null, tags: JSON.stringify(d.tags || []), status: d.status || 'current', fileUrl: d.file || d.fileUrl || '#', visibility: d.visibility || 'public' },
      update: { title: d.title, category: d.category || null, authority: d.authority || 'Internal', documentType: d.documentType || 'Document', year: d.year || null, academicYear: d.academicYear || null, program: d.program || null, description: d.description || null, tags: JSON.stringify(d.tags || []), status: d.status || 'current', fileUrl: d.file || d.fileUrl || '#', visibility: d.visibility || 'public' }
    });
  }

  const media = await readJson<any[]>('media', []);
  for (const m of media) {
    if (!m.url) continue;
    await prisma.mediaAsset.upsert({ where: { url: m.url }, create: { title: m.title || m.url.split('/').pop(), fileName: m.url.split('/').pop(), url: m.url, mimeType: m.type || null, size: m.size || null }, update: { title: m.title || m.url.split('/').pop() } });
  }


  const careers = await readJson<any[]>('careers', []);
  for (const job of careers) {
    const slug = job.slug || slugify(job.title);
    await prisma.jobOpening.upsert({
      where: { slug_branchId: { slug, branchId: '' } },
      create: { title: job.title, slug, department: job.department || null, employmentType: job.employmentType || null, deadline: parseDate(job.deadline), status: job.status || 'draft', description: job.description || null, eligibility: job.eligibility || null, noticeUrl: job.noticeUrl || null, applicationUrl: job.applicationUrl || null },
      update: { title: job.title, department: job.department || null, employmentType: job.employmentType || null, deadline: parseDate(job.deadline), status: job.status || 'draft', description: job.description || null, eligibility: job.eligibility || null, noticeUrl: job.noticeUrl || null, applicationUrl: job.applicationUrl || null }
    });
  }

  const events = await readJson<any[]>('events', []);
  for (const event of events) {
    const slug = event.slug || slugify(event.title);
    await prisma.event.upsert({
      where: { slug_branchId: { slug, branchId: '' } },
      create: { title: event.title, slug, category: event.category || null, summary: event.summary || null, body: event.body || null, startDate: parseDate(event.startDate), endDate: parseDate(event.endDate), status: event.status || 'draft', image: event.image || null },
      update: { title: event.title, category: event.category || null, summary: event.summary || null, body: event.body || null, startDate: parseDate(event.startDate), endDate: parseDate(event.endDate), status: event.status || 'draft', image: event.image || null }
    });
  }

  await prisma.securityEvent.create({ data: { event: 'seed_completed', severity: 'info', summary: 'Database seeded from existing project ZIP content.' } });
}

async function main() {
  await seedRolesAndUsers();
  await seedContent();
  console.log('Seeded enterprise CMS database.');
}

main().finally(async () => prisma.$disconnect());

