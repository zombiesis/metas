import { promises as fs } from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { scopedWhere } from '@/lib/prisma-tenant';
import { parseJson, slugify, toJson } from '@/lib/utils';

export const CMS_COLLECTIONS = [
  'site',
  'homepage-sections',
  'pages',
  'programs',
  'value-added-courses',
  'notices',
  'documents',
  'faculty',
  'media',
  'forms',
  'admissions',
  'recruiters',
  'alumni',
  'contacts',
  'events',
  'blogs',
  'careers',
  'users',
  'roles',
  'audit-logs',
  'security-events',
  'analytics-events'
] as const;

export type CMSCollection = (typeof CMS_COLLECTIONS)[number];

const cmsRoot = path.join(process.cwd(), 'content', 'cms');

export type SiteSettings = {
  name: string;
  shortName: string;
  organization: string;
  mission: string;
  vision: string;
  address: string;
  hours: string;
  phones: { registrar: string; admissions: string; placement: string; placementMobile: string };
  emails: { principal: string; registrar: string; placement: string };
  navigation: [string, string][];
  values: string[];
  infrastructure: string[];
  statPlaceholders: string[];
};

export type Program = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  duration: string;
  eligibility: string;
  summary: string;
  overview?: string;
  authorityNote?: string;
  admissionProcess?: string;
  attendanceRules?: string;
  semesterStructure?: string;
  careerOpportunities?: string;
  faqs?: string[];
  rules?: string[];
  documents?: string[];
  facultyIds?: string[];
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type Notice = {
  id?: string;
  title: string;
  slug?: string;
  category: string;
  date?: string;
  expiryDate?: string;
  url: string;
  status?: string;
  program?: string;
  pinned?: boolean;
  body?: string;
};

export type FacultyMember = {
  id?: string;
  name: string;
  slug?: string;
  qualification?: string;
  department?: string;
  designation?: string;
  photo?: string;
  verification?: string;
  experience?: string;
  expertise?: string;
  bio?: string;
  publications?: string[];
  contactEmail?: string;
  contactPhone?: string;
  contactVisible?: boolean;
  spotlight?: boolean;
  status?: string;
};

export type AccreditationDocument = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  authority: string;
  documentType: string;
  year: string;
  academicYear?: string;
  program: string;
  description?: string;
  tags?: string[];
  status: string;
  visibility?: string;
  file: string;
  fileUrl?: string;
  downloadCount?: number;
  viewCount?: number;
};

export type ValueAddedCourse = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  duration: string;
  eligibility: string;
  summary: string;
  image?: string;
  status?: string;
};

export type HomepageSection = {
  id?: string;
  key: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  order: number;
  visible: boolean;
  status: string;
  settings?: Record<string, unknown>;
};

export function isCollection(value: string): value is CMSCollection {
  return (CMS_COLLECTIONS as readonly string[]).includes(value);
}

export function assertCollection(value: string): CMSCollection {
  if (!isCollection(value)) throw new Error(`Unknown CMS collection: ${value}`);
  return value;
}

async function readFallback<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(cmsRoot, `${name}.json`), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.siteSetting.findFirst({ where: { key: 'site', branchId: (await scopedWhere()).branchId as string || null } });
    if (row) return parseJson<SiteSettings>(row.value, await readFallback<SiteSettings>('site', {} as SiteSettings));
  } catch {}
  return readFallback<SiteSettings>('site', {} as SiteSettings);
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    const where = await scopedWhere();
    const rows = await prisma.homepageSection.findMany({ where, orderBy: { order: 'asc' } });
    if (rows.length) return rows.map((row) => ({ ...row, settings: parseJson(row.settings, {}) }));
  } catch {}
  const pages = await readFallback<Record<string, any>>('pages', {});
  const home = pages.home || {};
  return [
    { key: 'hero', title: home.heroTitle, subtitle: home.heroSubtitle, body: '', order: 1, visible: true, status: 'published', settings: { primaryCta: 'Apply Now', secondaryCta: 'Admission Enquiry 2026-27' } },
    { key: 'welcome', title: home.welcomeTitle, body: home.welcomeBody, order: 5, visible: true, status: 'published', settings: {} }
  ];
}

export async function getPages(): Promise<Record<string, any>> {
  try {
    const where = await scopedWhere();
    const rows = await prisma.page.findMany({ where, orderBy: { slug: 'asc' } });
    if (rows.length) {
      return Object.fromEntries(rows.map((row) => [row.slug, { id: row.id, title: row.title, summary: row.summary, body: row.body, status: row.status, seoTitle: row.seoTitle, seoDescription: row.seoDescription, ...parseJson<Record<string, unknown>>(row.metadata, {}) }]));
    }
  } catch {}
  return readFallback<Record<string, any>>('pages', {});
}

export async function getPrograms(): Promise<Program[]> {
  try {
    const where = await scopedWhere({ deletedAt: null });
    const rows = await prisma.program.findMany({ where, orderBy: [{ category: 'asc' }, { title: 'asc' }] });
    if (rows.length) {
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category,
        status: row.status,
        duration: row.duration || '',
        eligibility: row.eligibility || '',
        summary: row.summary || '',
        overview: row.overview || undefined,
        authorityNote: row.authorityNote || undefined,
        admissionProcess: row.admissionProcess || undefined,
        attendanceRules: row.attendanceRules || undefined,
        semesterStructure: row.semesterStructure || undefined,
        careerOpportunities: row.careerOpportunities || undefined,
        faqs: parseJson<string[]>(row.faqs, []),
        rules: parseJson<string[]>(row.rules, []),
        documents: parseJson<string[]>(row.documents, []),
        facultyIds: parseJson<string[]>(row.facultyIds, []),
        image: row.image || undefined,
        seoTitle: row.seoTitle || undefined,
        seoDescription: row.seoDescription || undefined
      }));
    }
  } catch {}
  return readFallback<Program[]>('programs', []);
}

export async function getValueAddedCourses(): Promise<ValueAddedCourse[]> {
  return readFallback<ValueAddedCourse[]>('value-added-courses', []);
}

export async function getNotices(): Promise<Notice[]> {
  try {
    const where = await scopedWhere({ deletedAt: null });
    // Include shared notices (branchId=null) alongside branch-specific ones
    const branchFilter = where.branchId ? { OR: [{ branchId: where.branchId }, { branchId: null }], deletedAt: null } : { deletedAt: null };
    const rows = await prisma.notice.findMany({ where: branchFilter, orderBy: [{ pinned: 'desc' }, { date: 'desc' }, { createdAt: 'desc' }] });
    if (rows.length) return rows.map((row) => ({ id: row.id, title: row.title, slug: row.slug, category: row.category, date: row.date?.toISOString().slice(0, 10), expiryDate: row.expiryDate?.toISOString().slice(0, 10), status: row.status, program: row.program || undefined, url: row.externalUrl || row.documentUrl || '#', pinned: row.pinned, body: row.body || undefined }));
  } catch {}
  return readFallback<Notice[]>('notices', []);
}

export async function getDocuments(): Promise<AccreditationDocument[]> {
  try {
    const where = await scopedWhere();
    const rows = await prisma.document.findMany({ where, orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }] });
    if (rows.length) return rows.map((row) => ({ id: row.id, title: row.title, slug: row.slug, category: row.category || '', authority: row.authority, documentType: row.documentType, year: row.year || '', academicYear: row.academicYear || undefined, program: row.program || '', description: row.description || undefined, tags: parseJson<string[]>(row.tags, []), status: row.status, visibility: row.visibility, file: row.fileUrl, fileUrl: row.fileUrl, downloadCount: row.downloadCount, viewCount: row.viewCount }));
  } catch {}
  return readFallback<AccreditationDocument[]>('documents', []);
}

export async function getFaculty(): Promise<FacultyMember[]> {
  try {
    const where = await scopedWhere();
    const rows = await prisma.faculty.findMany({ where, orderBy: [{ spotlight: 'desc' }, { name: 'asc' }] });
    if (rows.length) return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, photo: row.photo || undefined, designation: row.designation || undefined, department: row.department || undefined, qualification: row.qualification || undefined, experience: row.experience || undefined, expertise: row.expertise || undefined, bio: row.bio || undefined, publications: parseJson<string[]>(row.publications, []), contactEmail: row.contactEmail || undefined, contactPhone: row.contactPhone || undefined, contactVisible: row.contactVisible, spotlight: row.spotlight, status: row.status }));
  } catch {}
  return readFallback<FacultyMember[]>('faculty', []);
}

export async function getAllCMSContent() {
  const [site, homepageSections, pages, programs, valueAddedCourses, notices, documents, faculty, media, events] = await Promise.all([
    getSiteSettings(),
    getHomepageSections(),
    getPages(),
    getPrograms(),
    getValueAddedCourses(),
    getNotices(),
    getDocuments(),
    getFaculty(),
    readCMSCollection<any[]>('media'),
    readCMSCollection<any[]>('events')
  ]);
  return { site, homepageSections, pages, programs, valueAddedCourses, notices, documents, faculty, media, events };
}

export async function readCMSCollection<T = unknown>(collection: CMSCollection): Promise<T> {
  const sw = await scopedWhere();
  switch (collection) {
    case 'site': return (await getSiteSettings()) as T;
    case 'homepage-sections': return (await getHomepageSections()) as T;
    case 'pages': return (await getPages()) as T;
    case 'programs': return (await getPrograms()) as T;
    case 'value-added-courses': return (await getValueAddedCourses()) as T;
    case 'notices': return (await getNotices()) as T;
    case 'documents': return (await getDocuments()) as T;
    case 'faculty': return (await getFaculty()) as T;
    case 'media': return (await prisma.mediaAsset.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => readFallback('media', []))) as T;
    case 'forms': return (await prisma.formSubmission.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => [])) as T;
    case 'admissions': return (await prisma.admissionLead.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => [])) as T;
    case 'recruiters': return (await prisma.recruiterInquiry.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => [])) as T;
    case 'alumni': return (await prisma.alumniRegistration.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => [])) as T;
    case 'contacts': return (await prisma.contactInquiry.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => [])) as T;
    case 'events': return (await prisma.event.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => readFallback('events', []))) as T;
    case 'blogs': return (await prisma.blogPost.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => readFallback('blogs', []))) as T;
    case 'careers': return (await prisma.jobOpening.findMany({ where: sw, orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => readFallback('careers', []))) as T;
    case 'users': return (await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { role: true } }).catch(() => [])) as T;
    case 'roles': return (await prisma.role.findMany({ orderBy: { name: 'asc' }, include: { permissions: { include: { permission: true } } } }).catch(() => [])) as T;
    case 'audit-logs': return (await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { user: true } }).catch(() => [])) as T;
    case 'security-events': return (await prisma.securityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { user: true } }).catch(() => [])) as T;
    case 'analytics-events': return (await prisma.analyticsEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 }).catch(() => [])) as T;
    default: throw new Error(`Unsupported collection ${collection}`);
  }
}

export async function listUploads() {
  const uploadRoot = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadRoot, { recursive: true });
  const files: { name: string; url: string; size: number; modified: string }[] = [];
  async function walk(dir: string, prefix = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      const relative = path.join(prefix, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) await walk(absolute, relative);
      else {
        const stat = await fs.stat(absolute);
        files.push({ name: entry.name, url: `/uploads/${relative}`, size: stat.size, modified: stat.mtime.toISOString() });
      }
    }
  }
  await walk(uploadRoot);
  return files.sort((a, b) => b.modified.localeCompare(a.modified));
}


export async function readAdminCollection<T = unknown>(collection: CMSCollection): Promise<T> {
  const w = await scopedWhere();
  switch (collection) {
    case 'site': return [await getSiteSettings()] as T;
    case 'homepage-sections': return (await getHomepageSections()) as T;
    case 'pages': return (await prisma.page.findMany({ where: w, orderBy: { slug: 'asc' } })) as T;
    case 'programs': return (await prisma.program.findMany({ where: w, orderBy: [{ category: 'asc' }, { title: 'asc' }] })).map((row: any) => ({ ...row, rules: parseJson(row.rules, []), documents: parseJson(row.documents, []), faqs: parseJson(row.faqs, []), facultyIds: parseJson(row.facultyIds, []) })) as T;
    case 'notices': return (await prisma.notice.findMany({ where: w, orderBy: [{ pinned: 'desc' }, { date: 'desc' }, { createdAt: 'desc' }] })).map((row: any) => ({ ...row, url: row.externalUrl || row.documentUrl || '' })) as T;
    case 'documents': return (await prisma.document.findMany({ where: w, orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }] })).map((row: any) => ({ ...row, file: row.fileUrl, tags: parseJson(row.tags, []) })) as T;
    case 'faculty': return (await prisma.faculty.findMany({ where: w, orderBy: [{ spotlight: 'desc' }, { name: 'asc' }] })).map((row: any) => ({ ...row, publications: parseJson(row.publications, []) })) as T;
    case 'media': return (await prisma.mediaAsset.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })).map((row: any) => ({ ...row, tags: parseJson(row.tags, []) })) as T;
    case 'value-added-courses': return (await getValueAddedCourses()) as T;
    case 'forms': return (await prisma.formSubmission.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })) as T;
    case 'admissions': return (await prisma.admissionLead.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })) as T;
    case 'recruiters': return (await prisma.recruiterInquiry.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })) as T;
    case 'alumni': return (await prisma.alumniRegistration.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })) as T;
    case 'contacts': return (await prisma.contactInquiry.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })) as T;
    case 'events': return (await prisma.event.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })) as T;
    case 'blogs': return (await prisma.blogPost.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })) as T;
    case 'careers': return (await prisma.jobOpening.findMany({ where: w, orderBy: { createdAt: 'desc' }, take: 500 })) as T;
    case 'users': return (await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { role: true } })) as T;
    case 'roles': return (await prisma.role.findMany({ orderBy: { name: 'asc' }, include: { permissions: { include: { permission: true } } } })) as T;
    case 'audit-logs': return (await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { user: true } })) as T;
    case 'security-events': return (await prisma.securityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 500, include: { user: true } })) as T;
    case 'analytics-events': return (await prisma.analyticsEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 })) as T;
    default: throw new Error(`Unsupported admin collection ${collection}`);
  }
}

export async function bumpDocumentDownload(slugOrId: string) {
  try {
    await prisma.document.update({ where: { id: slugOrId }, data: { downloadCount: { increment: 1 } } });
  } catch {
    try { await prisma.document.update({ where: { slug: slugOrId }, data: { downloadCount: { increment: 1 } } }); } catch {}
  }
}

export function defaultSlug(title: string) {
  return slugify(title);
}
