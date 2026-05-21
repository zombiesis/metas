import { NextRequest, NextResponse } from 'next/server';
import { assertCollection, readAdminCollection, type CMSCollection } from '@/lib/cms-db';
import { requireAdminApi, hashPassword, require2faForSensitive, validatePasswordStrength } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { tenantCreateData } from '@/lib/prisma-tenant';
import { auditLog } from '@/lib/audit';
import { parseDateInput, slugify, toJson } from '@/lib/utils';
import { sanitizeRichText } from '@/lib/security';
import { can, invalidateRbacCache } from '@/lib/rbac';
import { validateInput } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ collection: string }> };

function jsonError(error: unknown, status = 400) {
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
    const fields: Record<string, string> = {};
    for (const issue of issues) fields[issue.path.join('.') || '_'] = issue.message;
    return NextResponse.json({ ok: false, error: 'Validation failed', fields }, { status: 422 });
  }
  return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status });
}

function noReadonly(collection: CMSCollection) {
  if (['audit-logs', 'security-events', 'analytics-events'].includes(collection)) throw new Error('This collection is read-only.');
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map((item) => item.trim()).filter(Boolean);
  return [];
}

function str(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}

function stripSystem(data: any) {
  const copy = { ...data };
  for (const key of ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'role', 'permissions', 'passwordHash']) delete copy[key];
  return copy;
}

function expose(collection: CMSCollection, record: any) {
  if (!record) return record;
  const copy = JSON.parse(JSON.stringify(record));
  delete copy.passwordHash;
  if (copy.role?.name) copy.roleName = copy.role.name;
  if (collection === 'roles' && copy.permissions) copy.permissionKeys = copy.permissions.map((item: any) => item.permission?.key).filter(Boolean);
  if (collection === 'programs') {
    for (const key of ['rules', 'documents', 'faqs', 'facultyIds']) copy[key] = JSON.parse(copy[key] || '[]');
  }
  if (['documents', 'media'].includes(collection)) copy.tags = JSON.parse(copy.tags || '[]');
  if (collection === 'faculty') copy.publications = JSON.parse(copy.publications || '[]');
  if (collection === 'documents') copy.file = copy.fileUrl;
  if (collection === 'notices') copy.url = copy.externalUrl || copy.documentUrl || '';
  return copy;
}

async function createRecord(collection: CMSCollection, data: any, username: string) {
  const d = stripSystem(data);
  const branch = d.branchId ? { branchId: d.branchId } : {};
  switch (collection) {
    case 'pages': return prisma.page.create({ data: { ...branch, title: str(d.title, 'Untitled page'), slug: slugify(str(d.slug || d.title)), summary: d.summary || null, body: sanitizeRichText(str(d.body)), status: d.status || 'draft', seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null, metadata: '{}', createdBy: username, updatedBy: username } });
    case 'programs': return prisma.program.create({ data: { ...branch, title: str(d.title, 'Untitled program'), slug: slugify(str(d.slug || d.title)), category: d.category || 'General', status: d.status || 'draft', duration: d.duration || null, eligibility: d.eligibility || null, summary: d.summary || null, overview: sanitizeRichText(str(d.overview)) || null, authorityNote: d.authorityNote || null, admissionProcess: sanitizeRichText(str(d.admissionProcess)) || null, attendanceRules: d.attendanceRules || null, semesterStructure: d.semesterStructure || null, careerOpportunities: d.careerOpportunities || null, rules: toJson(list(d.rules)), documents: toJson(list(d.documents)), faqs: toJson(list(d.faqs)), facultyIds: toJson(list(d.facultyIds)), image: d.image || null, seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null, createdBy: username, updatedBy: username } });
    case 'notices': return prisma.notice.create({ data: { ...branch, title: str(d.title, 'Untitled notice'), slug: slugify(str(d.slug || d.title)), category: d.category || 'General', date: parseDateInput(d.date), expiryDate: parseDateInput(d.expiryDate), status: d.status || 'active', program: d.program || null, externalUrl: d.url || null, documentUrl: d.documentUrl || null, pinned: Boolean(d.pinned), body: sanitizeRichText(str(d.body)) || null, createdBy: username, updatedBy: username } });
    case 'documents': return prisma.document.create({ data: { ...branch, title: str(d.title, 'Untitled document'), slug: slugify(str(d.slug || d.title)), category: d.category || null, authority: d.authority || 'Internal', documentType: d.documentType || 'Document', year: d.year || null, academicYear: d.academicYear || null, program: d.program || null, description: d.description || null, tags: toJson(list(d.tags)), status: d.status || 'current', visibility: d.visibility || 'public', fileUrl: d.file || d.fileUrl || '#', createdBy: username, updatedBy: username } });
    case 'faculty': return prisma.faculty.create({ data: { ...branch, name: str(d.name, 'Untitled faculty'), slug: slugify(str(d.slug || d.name)), photo: d.photo || null, designation: d.designation || null, department: d.department || null, qualification: d.qualification || null, experience: d.experience || null, expertise: d.expertise || null, bio: sanitizeRichText(str(d.bio)) || null, publications: toJson(list(d.publications)), contactEmail: d.contactEmail || null, contactPhone: d.contactPhone || null, contactVisible: Boolean(d.contactVisible), spotlight: Boolean(d.spotlight), status: d.status || 'draft', createdBy: username, updatedBy: username } });
    case 'media': return prisma.mediaAsset.create({ data: { ...branch, title: str(d.title, 'Untitled media'), fileName: d.fileName || String(d.url || '').split('/').pop() || 'file', url: d.url || '#', mimeType: d.mimeType || null, folder: d.folder || null, altText: d.altText || null, caption: d.caption || null, tags: toJson(list(d.tags)), status: d.status || 'active', createdBy: username, updatedBy: username } });
    case 'forms': return prisma.formSubmission.create({ data: { ...branch, kind: d.kind || 'manual', name: d.name || null, phone: d.phone || null, email: d.email || null, program: d.program || null, message: d.message || null, status: d.status || 'new', assignedTo: d.assignedTo || null, notes: d.notes || null, consent: Boolean(d.consent), data: '{}' } });
    case 'admissions': return prisma.admissionLead.create({ data: { ...branch, studentName: str(d.studentName, 'Manual lead'), parentName: d.parentName || null, phone: str(d.phone), whatsapp: d.whatsapp || null, email: d.email || null, city: d.city || null, program: d.program || null, qualification: d.qualification || null, message: d.message || null, status: d.status || 'new', assignedTo: d.assignedTo || null, followUpAt: parseDateInput(d.followUpAt), notes: d.notes || null, consent: Boolean(d.consent) } });
    case 'recruiters': return prisma.recruiterInquiry.create({ data: { ...branch, company: str(d.company, 'Company'), contactPerson: d.contactPerson || null, designation: d.designation || null, phone: d.phone || null, email: d.email || null, hiringRequirement: d.hiringRequirement || null, programInterest: d.programInterest || null, message: d.message || null, status: d.status || 'new', consent: Boolean(d.consent) } });
    case 'alumni': return prisma.alumniRegistration.create({ data: { ...branch, name: str(d.name, 'Alumni'), graduationYear: d.graduationYear || null, program: d.program || null, profession: d.profession || null, company: d.company || null, phone: d.phone || null, email: d.email || null, linkedIn: d.linkedIn || null, message: d.message || null, status: d.status || 'new', consent: Boolean(d.consent) } });
    case 'contacts': return prisma.contactInquiry.create({ data: { ...branch, name: str(d.name, 'Contact'), phone: d.phone || null, email: d.email || null, inquiryType: d.inquiryType || 'General', message: d.message || null, status: d.status || 'new', consent: Boolean(d.consent) } });
    case 'events': return prisma.event.create({ data: { ...branch, title: str(d.title, 'Untitled event'), slug: slugify(str(d.slug || d.title)), category: d.category || null, summary: d.summary || null, body: sanitizeRichText(str(d.body)) || null, startDate: parseDateInput(d.startDate), endDate: parseDateInput(d.endDate), status: d.status || 'draft', image: d.image || null, createdBy: username, updatedBy: username } });
    case 'blogs': return prisma.blogPost.create({ data: { ...branch, title: str(d.title, 'Untitled post'), slug: slugify(str(d.slug || d.title)), summary: d.summary || null, body: sanitizeRichText(str(d.body)) || null, status: d.status || 'draft', image: d.image || null, publishedAt: parseDateInput(d.publishedAt), seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null, createdBy: username, updatedBy: username } });
    case 'careers': return prisma.jobOpening.create({ data: { ...branch, title: str(d.title, 'Untitled job'), slug: slugify(str(d.slug || d.title)), department: d.department || null, employmentType: d.employmentType || null, deadline: parseDateInput(d.deadline), status: d.status || 'draft', description: sanitizeRichText(str(d.description)) || null, eligibility: d.eligibility || null, noticeUrl: d.noticeUrl || null, applicationUrl: d.applicationUrl || null, createdBy: username, updatedBy: username } });
    case 'users': {
      const pw = d.password || '';
      const pwCheck = validatePasswordStrength(pw);
      if (!pwCheck.ok) throw new Error(`Weak password: ${pwCheck.errors.join(', ')}`);
      const role = d.roleName ? await prisma.role.findUnique({ where: { name: d.roleName } }) : null;
      return prisma.user.create({ data: { username: str(d.username), email: d.email || null, name: d.name || null, passwordHash: await hashPassword(pw), status: d.status || 'active', roleId: role?.id } });
    }
    case 'roles': {
      const role = await prisma.role.create({ data: { name: str(d.name, 'Role'), description: d.description || null } });
      for (const key of list(d.permissionKeys)) {
        const permission = await prisma.permission.upsert({ where: { key }, create: { key }, update: {} });
        await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
      }
      invalidateRbacCache(str(d.name, 'Role'));
      return prisma.role.findUnique({ where: { id: role.id }, include: { permissions: { include: { permission: true } } } });
    }
    default: throw new Error(`Create is not supported for ${collection}.`);
  }
}

async function updateRecord(collection: CMSCollection, id: string, data: any, username: string) {
  const d = stripSystem(data);
  switch (collection) {
    case 'pages': {
      const existing = await prisma.page.findUnique({ where: { id } });
      if (existing) {
        const count = await prisma.pageVersion.count({ where: { pageId: id } });
        await prisma.pageVersion.create({ data: { pageId: id, version: count + 1, snapshot: JSON.stringify(existing), createdBy: username } }).catch(() => {
          // Retry with max version + 1 on duplicate
          return prisma.pageVersion.findFirst({ where: { pageId: id }, orderBy: { version: 'desc' } }).then(last =>
            prisma.pageVersion.create({ data: { pageId: id, version: (last?.version || 0) + 1, snapshot: JSON.stringify(existing), createdBy: username } })
          );
        });
      }
      return prisma.page.update({ where: { id }, data: { title: str(d.title, 'Untitled page'), slug: slugify(str(d.slug || d.title)), summary: d.summary || null, body: sanitizeRichText(str(d.body)) || null, status: d.status || 'draft', seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null, updatedBy: username } });
    }
    case 'programs': return prisma.program.update({ where: { id }, data: { title: str(d.title, 'Untitled program'), slug: slugify(str(d.slug || d.title)), category: d.category || 'General', status: d.status || 'draft', duration: d.duration || null, eligibility: d.eligibility || null, summary: d.summary || null, overview: sanitizeRichText(str(d.overview)) || null, authorityNote: d.authorityNote || null, admissionProcess: sanitizeRichText(str(d.admissionProcess)) || null, attendanceRules: d.attendanceRules || null, semesterStructure: d.semesterStructure || null, careerOpportunities: d.careerOpportunities || null, rules: toJson(list(d.rules)), documents: toJson(list(d.documents)), faqs: toJson(list(d.faqs)), facultyIds: toJson(list(d.facultyIds)), image: d.image || null, seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null, updatedBy: username } });
    case 'notices': return prisma.notice.update({ where: { id }, data: { title: str(d.title, 'Untitled notice'), slug: slugify(str(d.slug || d.title)), category: d.category || 'General', date: parseDateInput(d.date), expiryDate: parseDateInput(d.expiryDate), status: d.status || 'active', program: d.program || null, externalUrl: d.url || null, documentUrl: d.documentUrl || null, pinned: Boolean(d.pinned), body: sanitizeRichText(str(d.body)) || null, updatedBy: username } });
    case 'documents': return prisma.document.update({ where: { id }, data: { title: str(d.title, 'Untitled document'), slug: slugify(str(d.slug || d.title)), category: d.category || null, authority: d.authority || 'Internal', documentType: d.documentType || 'Document', year: d.year || null, academicYear: d.academicYear || null, program: d.program || null, description: d.description || null, tags: toJson(list(d.tags)), status: d.status || 'current', visibility: d.visibility || 'public', fileUrl: d.file || d.fileUrl || '#', version: { increment: 1 }, updatedBy: username } });
    case 'faculty': return prisma.faculty.update({ where: { id }, data: { name: str(d.name, 'Untitled faculty'), slug: slugify(str(d.slug || d.name)), photo: d.photo || null, designation: d.designation || null, department: d.department || null, qualification: d.qualification || null, experience: d.experience || null, expertise: d.expertise || null, bio: sanitizeRichText(str(d.bio)) || null, publications: toJson(list(d.publications)), contactEmail: d.contactEmail || null, contactPhone: d.contactPhone || null, contactVisible: Boolean(d.contactVisible), spotlight: Boolean(d.spotlight), status: d.status || 'draft', updatedBy: username } });
    case 'media': return prisma.mediaAsset.update({ where: { id }, data: { title: str(d.title, 'Untitled media'), fileName: d.fileName || String(d.url || '').split('/').pop() || 'file', url: d.url || '#', mimeType: d.mimeType || null, folder: d.folder || null, altText: d.altText || null, caption: d.caption || null, tags: toJson(list(d.tags)), status: d.status || 'active', updatedBy: username } });
    case 'forms': return prisma.formSubmission.update({ where: { id }, data: { status: d.status || 'new', name: d.name || null, phone: d.phone || null, email: d.email || null, program: d.program || null, message: d.message || null, assignedTo: d.assignedTo || null, notes: d.notes || null } });
    case 'admissions': return prisma.admissionLead.update({ where: { id }, data: { studentName: str(d.studentName, 'Manual lead'), parentName: d.parentName || null, phone: str(d.phone), whatsapp: d.whatsapp || null, email: d.email || null, city: d.city || null, program: d.program || null, qualification: d.qualification || null, message: d.message || null, status: d.status || 'new', assignedTo: d.assignedTo || null, followUpAt: parseDateInput(d.followUpAt), notes: d.notes || null } });
    case 'recruiters': return prisma.recruiterInquiry.update({ where: { id }, data: { company: str(d.company, 'Company'), contactPerson: d.contactPerson || null, designation: d.designation || null, phone: d.phone || null, email: d.email || null, hiringRequirement: d.hiringRequirement || null, programInterest: d.programInterest || null, message: d.message || null, status: d.status || 'new' } });
    case 'alumni': return prisma.alumniRegistration.update({ where: { id }, data: { name: str(d.name, 'Alumni'), graduationYear: d.graduationYear || null, program: d.program || null, profession: d.profession || null, company: d.company || null, phone: d.phone || null, email: d.email || null, linkedIn: d.linkedIn || null, message: d.message || null, status: d.status || 'new' } });
    case 'contacts': return prisma.contactInquiry.update({ where: { id }, data: { name: str(d.name, 'Contact'), phone: d.phone || null, email: d.email || null, inquiryType: d.inquiryType || 'General', message: d.message || null, status: d.status || 'new' } });
    case 'events': return prisma.event.update({ where: { id }, data: { title: str(d.title, 'Untitled event'), slug: slugify(str(d.slug || d.title)), category: d.category || null, summary: d.summary || null, body: sanitizeRichText(str(d.body)) || null, startDate: parseDateInput(d.startDate), endDate: parseDateInput(d.endDate), status: d.status || 'draft', image: d.image || null, updatedBy: username } });
    case 'blogs': return prisma.blogPost.update({ where: { id }, data: { title: str(d.title, 'Untitled post'), slug: slugify(str(d.slug || d.title)), summary: d.summary || null, body: sanitizeRichText(str(d.body)) || null, status: d.status || 'draft', image: d.image || null, publishedAt: parseDateInput(d.publishedAt), seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null, updatedBy: username } });
    case 'careers': return prisma.jobOpening.update({ where: { id }, data: { title: str(d.title, 'Untitled job'), slug: slugify(str(d.slug || d.title)), department: d.department || null, employmentType: d.employmentType || null, deadline: parseDateInput(d.deadline), status: d.status || 'draft', description: sanitizeRichText(str(d.description)) || null, eligibility: d.eligibility || null, noticeUrl: d.noticeUrl || null, applicationUrl: d.applicationUrl || null, updatedBy: username } });
    case 'users': {
      if (d.password) {
        const pwCheck = validatePasswordStrength(d.password);
        if (!pwCheck.ok) throw new Error(`Weak password: ${pwCheck.errors.join(', ')}`);
      }
      const role = d.roleName ? await prisma.role.findUnique({ where: { name: d.roleName } }) : null;
      return prisma.user.update({ where: { id }, data: { username: str(d.username), email: d.email || null, name: d.name || null, status: d.status || 'active', roleId: role?.id, ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}) }, include: { role: true } });
    }
    case 'roles': {
      const role = await prisma.role.update({ where: { id }, data: { name: str(d.name, 'Role'), description: d.description || null } });
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      for (const key of list(d.permissionKeys)) {
        const permission = await prisma.permission.upsert({ where: { key }, create: { key }, update: {} });
        await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
      }
      invalidateRbacCache();
      return prisma.role.findUnique({ where: { id: role.id }, include: { permissions: { include: { permission: true } } } });
    }
    default: throw new Error(`Update is not supported for ${collection}.`);
  }
}

async function deleteRecord(collection: CMSCollection, id: string) {
  const softDelete = { deletedAt: new Date() };
  switch (collection) {
    case 'pages': return prisma.page.update({ where: { id }, data: softDelete });
    case 'programs': return prisma.program.update({ where: { id }, data: softDelete });
    case 'notices': return prisma.notice.update({ where: { id }, data: softDelete });
    case 'documents': return prisma.document.delete({ where: { id } });
    case 'faculty': return prisma.faculty.delete({ where: { id } });
    case 'media': return prisma.mediaAsset.delete({ where: { id } });
    case 'forms': return prisma.formSubmission.delete({ where: { id } });
    case 'admissions': return prisma.admissionLead.delete({ where: { id } });
    case 'recruiters': return prisma.recruiterInquiry.delete({ where: { id } });
    case 'alumni': return prisma.alumniRegistration.delete({ where: { id } });
    case 'contacts': return prisma.contactInquiry.delete({ where: { id } });
    case 'events': return prisma.event.delete({ where: { id } });
    case 'blogs': return prisma.blogPost.delete({ where: { id } });
    case 'careers': return prisma.jobOpening.delete({ where: { id } });
    case 'users': return prisma.user.delete({ where: { id } });
    case 'roles': return prisma.role.delete({ where: { id } });
    default: throw new Error(`Delete is not supported for ${collection}.`);
  }
}

async function paginateCollection(collection: CMSCollection, where: Record<string, unknown>, skip: number, take: number, search?: string): Promise<{ data: any[]; total: number } | null> {
  // Build search filter based on collection's available fields
  const titleCollections = ['pages', 'programs', 'notices', 'documents', 'events', 'blogs', 'careers', 'media'];
  const nameCollections = ['faculty', 'admissions', 'alumni', 'contacts', 'recruiters', 'users'];
  let searchWhere: Record<string, unknown> = {};
  if (search) {
    const or: Record<string, unknown>[] = [];
    if (titleCollections.includes(collection)) or.push({ title: { contains: search } });
    if (nameCollections.includes(collection) && collection !== 'admissions' && collection !== 'recruiters') or.push({ name: { contains: search } });
    if (collection === 'admissions') or.push({ studentName: { contains: search } });
    if (collection === 'recruiters') or.push({ company: { contains: search } });
    if (collection === 'users') or.push({ username: { contains: search } });
    if (or.length) searchWhere = { OR: or };
  }
  const w = { ...where, ...searchWhere };
  try {
    switch (collection) {
      case 'pages': { const [data, total] = await Promise.all([prisma.page.findMany({ where: w as any, skip, take, orderBy: { slug: 'asc' } }), prisma.page.count({ where: w as any })]); return { data, total }; }
      case 'programs': { const [data, total] = await Promise.all([prisma.program.findMany({ where: w as any, skip, take, orderBy: [{ category: 'asc' }, { title: 'asc' }] }), prisma.program.count({ where: w as any })]); return { data, total }; }
      case 'notices': { const [data, total] = await Promise.all([prisma.notice.findMany({ where: w as any, skip, take, orderBy: [{ pinned: 'desc' }, { date: 'desc' }] }), prisma.notice.count({ where: w as any })]); return { data, total }; }
      case 'documents': { const [data, total] = await Promise.all([prisma.document.findMany({ where: w as any, skip, take, orderBy: { updatedAt: 'desc' } }), prisma.document.count({ where: w as any })]); return { data, total }; }
      case 'faculty': { const [data, total] = await Promise.all([prisma.faculty.findMany({ where: w as any, skip, take, orderBy: { name: 'asc' } }), prisma.faculty.count({ where: w as any })]); return { data, total }; }
      case 'media': { const [data, total] = await Promise.all([prisma.mediaAsset.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.mediaAsset.count({ where: w as any })]); return { data, total }; }
      case 'events': { const [data, total] = await Promise.all([prisma.event.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.event.count({ where: w as any })]); return { data, total }; }
      case 'blogs': { const [data, total] = await Promise.all([prisma.blogPost.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.blogPost.count({ where: w as any })]); return { data, total }; }
      case 'careers': { const [data, total] = await Promise.all([prisma.jobOpening.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.jobOpening.count({ where: w as any })]); return { data, total }; }
      case 'forms': { const [data, total] = await Promise.all([prisma.formSubmission.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.formSubmission.count({ where: w as any })]); return { data, total }; }
      case 'admissions': { const [data, total] = await Promise.all([prisma.admissionLead.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.admissionLead.count({ where: w as any })]); return { data, total }; }
      case 'recruiters': { const [data, total] = await Promise.all([prisma.recruiterInquiry.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.recruiterInquiry.count({ where: w as any })]); return { data, total }; }
      case 'alumni': { const [data, total] = await Promise.all([prisma.alumniRegistration.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.alumniRegistration.count({ where: w as any })]); return { data, total }; }
      case 'contacts': { const [data, total] = await Promise.all([prisma.contactInquiry.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' } }), prisma.contactInquiry.count({ where: w as any })]); return { data, total }; }
      case 'users': { const [data, total] = await Promise.all([prisma.user.findMany({ where: w as any, skip, take, orderBy: { createdAt: 'desc' }, include: { role: true } }), prisma.user.count({ where: w as any })]); return { data, total }; }
      case 'audit-logs': {
        const branchId = await (await import('@/lib/tenant')).getCurrentBranchId();
        const userFilter = branchId ? { userId: { in: (await prisma.userBranch.findMany({ where: { branchId }, select: { userId: true } })).map(u => u.userId) } } : {};
        const [data, total] = await Promise.all([prisma.auditLog.findMany({ where: userFilter, skip, take, orderBy: { createdAt: 'desc' }, include: { user: true } }), prisma.auditLog.count({ where: userFilter })]);
        return { data, total };
      }
      case 'security-events': {
        const branchId2 = await (await import('@/lib/tenant')).getCurrentBranchId();
        const userFilter2 = branchId2 ? { userId: { in: (await prisma.userBranch.findMany({ where: { branchId: branchId2 }, select: { userId: true } })).map(u => u.userId) } } : {};
        const [data, total] = await Promise.all([prisma.securityEvent.findMany({ where: userFilter2, skip, take, orderBy: { createdAt: 'desc' }, include: { user: true } }), prisma.securityEvent.count({ where: userFilter2 })]);
        return { data, total };
      }
      case 'analytics-events': { const [data, total] = await Promise.all([prisma.analyticsEvent.findMany({ skip, take, orderBy: { createdAt: 'desc' } }), prisma.analyticsEvent.count()]); return { data, total }; }
      default: return null;
    }
  } catch { return null; }
}

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'view')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  try {
    const { collection: collectionParam } = await context.params;
    const collection = assertCollection(collectionParam);
    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const search = url.searchParams.get('search')?.trim() || '';
    const status = url.searchParams.get('status')?.trim() || '';
    const locale = url.searchParams.get('locale')?.trim() || '';
    const skip = (page - 1) * limit;

    // Build where clause for collections that support filtering
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (locale) where.locale = locale;
    if (search) where.OR = [
      { title: { contains: search } },
      { name: { contains: search } },
      { slug: { contains: search } },
    ];

    // Try server-side pagination for supported collections
    const paginatedCollections = ['pages', 'programs', 'notices', 'documents', 'faculty', 'media', 'events', 'blogs', 'careers', 'forms', 'admissions', 'recruiters', 'alumni', 'contacts', 'users', 'audit-logs', 'security-events', 'analytics-events'];

    if (paginatedCollections.includes(collection)) {
      const filterWhere: Record<string, unknown> = {};
      if (status) filterWhere.status = status;
      if (locale) filterWhere.locale = locale;

      const result = await paginateCollection(collection, filterWhere, skip, limit, search || undefined);
      if (result) {
        const records = result.data.map((record: any) => expose(collection, record));
        const totalPages = Math.ceil(result.total / limit);
        return NextResponse.json({ ok: true, collection, data: records, meta: { page, limit, total: result.total, totalPages } });
      }
    }

    // Fallback: load all and paginate in JS (for search or unsupported collections)
    const allData = await readAdminCollection(collection);
    let records = Array.isArray(allData) ? allData.map((record) => expose(collection, record)) : [];

    if (locale && records.length) {
      records = records.filter((r: any) => r.locale === locale);
    }
    if (status && records.length) {
      records = records.filter((r: any) => r.status === status);
    }
    if (search && records.length) {
      const q = search.toLowerCase();
      records = records.filter((r: any) => Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(q)));
    }

    const total = records.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = records.slice(skip, skip + limit);

    return NextResponse.json({ ok: true, collection, data: paginated, meta: { page, limit, total, totalPages } });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  try {
    const { collection: collectionParam } = await context.params;
    const collection = assertCollection(collectionParam);
    noReadonly(collection);
    if (!await can(auth.session!.roleName, 'create')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    if (['users', 'roles'].includes(collection)) {
      const block = await require2faForSensitive(auth.session!.userId);
      if (block) return block;
    }
    const { data } = await request.json();
    const validated = validateInput(collection, data || {});
    const tenant = await tenantCreateData();
    const record = await createRecord(collection, { ...(validated as any), ...tenant }, auth.session!.username);
    await auditLog({ action: 'created_content', entityType: collection, entityId: record?.id, summary: `Created ${collection} record`, userId: auth.session!.userId, afterValue: record, request });
    return NextResponse.json({ ok: true, record: expose(collection, record) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, context: Context) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  try {
    const { collection: collectionParam } = await context.params;
    const collection = assertCollection(collectionParam);
    noReadonly(collection);
    if (!await can(auth.session!.roleName, 'edit')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    if (['users', 'roles'].includes(collection)) {
      const block = await require2faForSensitive(auth.session!.userId);
      if (block) return block;
    }
    const { id, data } = await request.json();
    if (!id) return jsonError('Missing record id.');
    const branchId = await (await import('@/lib/tenant')).getCurrentBranchId();
    if (branchId && !['users', 'roles'].includes(collection)) {
      const modelMap: Record<string, string> = { pages: 'page', programs: 'program', notices: 'notice', documents: 'document', faculty: 'faculty', media: 'mediaAsset', events: 'event', blogs: 'blogPost', careers: 'jobOpening', forms: 'formSubmission', admissions: 'admissionLead', recruiters: 'recruiterInquiry', alumni: 'alumniRegistration', contacts: 'contactInquiry' };
      const model = (prisma as any)[modelMap[collection] || collection];
      const existing = model ? await model.findUnique({ where: { id }, select: { branchId: true } }).catch(() => null) : null;
      if (existing && existing.branchId && existing.branchId !== branchId) return NextResponse.json({ ok: false, error: 'Record not found' }, { status: 404 });
    }
    const validated = validateInput(collection, data || {});
    const record = await updateRecord(collection, id, validated, auth.session!.username);
    await auditLog({ action: 'updated_content', entityType: collection, entityId: id, summary: `Updated ${collection} record`, userId: auth.session!.userId, afterValue: record, request });
    return NextResponse.json({ ok: true, record: expose(collection, record) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  try {
    const { collection: collectionParam } = await context.params;
    const collection = assertCollection(collectionParam);
    noReadonly(collection);
    if (!await can(auth.session!.roleName, 'delete')) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    if (['users', 'roles'].includes(collection)) {
      const block = await require2faForSensitive(auth.session!.userId);
      if (block) return block;
    }
    const { id } = await request.json();
    if (!id) return jsonError('Missing record id.');
    // Verify record belongs to current branch
    const branchId = await (await import('@/lib/tenant')).getCurrentBranchId();
    if (branchId && !['users', 'roles'].includes(collection)) {
      const modelMap: Record<string, string> = { pages: 'page', programs: 'program', notices: 'notice', documents: 'document', faculty: 'faculty', media: 'mediaAsset', events: 'event', blogs: 'blogPost', careers: 'jobOpening', forms: 'formSubmission', admissions: 'admissionLead', recruiters: 'recruiterInquiry', alumni: 'alumniRegistration', contacts: 'contactInquiry' };
      const model = (prisma as any)[modelMap[collection] || collection];
      const existing = model ? await model.findUnique({ where: { id }, select: { branchId: true } }).catch(() => null) : null;
      if (existing && existing.branchId && existing.branchId !== branchId) return NextResponse.json({ ok: false, error: 'Record not found' }, { status: 404 });
    }
    const record = await deleteRecord(collection, id);
    await auditLog({ action: 'deleted_content', entityType: collection, entityId: id, summary: `Deleted ${collection} record`, userId: auth.session!.userId, beforeValue: record, request });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
