import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { can } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST: Clone content from one branch to another */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  if (!await can(auth.session!.roleName, 'manage_branches')) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const { sourceBranchId, targetBranchId, collections } = await request.json();
  if (!sourceBranchId || !targetBranchId) return NextResponse.json({ ok: false, error: 'sourceBranchId and targetBranchId required' }, { status: 400 });
  if (sourceBranchId === targetBranchId) return NextResponse.json({ ok: false, error: 'Cannot clone to same branch' }, { status: 400 });

  const cloneableCollections = collections || ['pages', 'programs', 'notices', 'documents', 'faculty', 'events', 'homepage-sections'];
  const results: Record<string, number> = {};

  for (const collection of cloneableCollections) {
    let count = 0;
    switch (collection) {
      case 'pages': {
        const rows = await prisma.page.findMany({ where: { branchId: sourceBranchId, deletedAt: null } });
        for (const r of rows) {
          await prisma.page.create({ data: { branchId: targetBranchId, slug: `${r.slug}-clone`, locale: r.locale, title: r.title, summary: r.summary, body: r.body, status: 'draft', seoTitle: r.seoTitle, seoDescription: r.seoDescription, metadata: r.metadata, createdBy: auth.session!.username, updatedBy: auth.session!.username } });
          count++;
        }
        break;
      }
      case 'programs': {
        const rows = await prisma.program.findMany({ where: { branchId: sourceBranchId, deletedAt: null } });
        for (const r of rows) {
          await prisma.program.create({ data: { branchId: targetBranchId, slug: `${r.slug}-clone`, locale: r.locale, title: r.title, category: r.category, status: 'draft', duration: r.duration, eligibility: r.eligibility, summary: r.summary, overview: r.overview, authorityNote: r.authorityNote, admissionProcess: r.admissionProcess, attendanceRules: r.attendanceRules, semesterStructure: r.semesterStructure, careerOpportunities: r.careerOpportunities, faqs: r.faqs, rules: r.rules, documents: r.documents, facultyIds: r.facultyIds, image: r.image, seoTitle: r.seoTitle, seoDescription: r.seoDescription, createdBy: auth.session!.username, updatedBy: auth.session!.username } });
          count++;
        }
        break;
      }
      case 'notices': {
        const rows = await prisma.notice.findMany({ where: { branchId: sourceBranchId, deletedAt: null } });
        for (const r of rows) {
          await prisma.notice.create({ data: { branchId: targetBranchId, slug: `${r.slug}-clone`, locale: r.locale, title: r.title, category: r.category, date: r.date, expiryDate: r.expiryDate, status: 'draft', program: r.program, externalUrl: r.externalUrl, documentUrl: r.documentUrl, pinned: r.pinned, body: r.body, createdBy: auth.session!.username, updatedBy: auth.session!.username } });
          count++;
        }
        break;
      }
      case 'documents': {
        const rows = await prisma.document.findMany({ where: { branchId: sourceBranchId } });
        for (const r of rows) {
          await prisma.document.create({ data: { branchId: targetBranchId, slug: `${r.slug}-clone`, title: r.title, category: r.category, authority: r.authority, documentType: r.documentType, year: r.year, academicYear: r.academicYear, program: r.program, description: r.description, tags: r.tags, status: r.status, visibility: r.visibility, fileUrl: r.fileUrl, createdBy: auth.session!.username, updatedBy: auth.session!.username } });
          count++;
        }
        break;
      }
      case 'faculty': {
        const rows = await prisma.faculty.findMany({ where: { branchId: sourceBranchId } });
        for (const r of rows) {
          await prisma.faculty.create({ data: { branchId: targetBranchId, slug: `${r.slug}-clone`, name: r.name, photo: r.photo, designation: r.designation, department: r.department, qualification: r.qualification, experience: r.experience, expertise: r.expertise, bio: r.bio, publications: r.publications, contactEmail: r.contactEmail, contactPhone: r.contactPhone, contactVisible: r.contactVisible, spotlight: r.spotlight, status: 'draft', createdBy: auth.session!.username, updatedBy: auth.session!.username } });
          count++;
        }
        break;
      }
      case 'events': {
        const rows = await prisma.event.findMany({ where: { branchId: sourceBranchId } });
        for (const r of rows) {
          await prisma.event.create({ data: { branchId: targetBranchId, slug: `${r.slug}-clone`, title: r.title, category: r.category, summary: r.summary, body: r.body, startDate: r.startDate, endDate: r.endDate, status: 'draft', image: r.image, createdBy: auth.session!.username, updatedBy: auth.session!.username } });
          count++;
        }
        break;
      }
      case 'homepage-sections': {
        const rows = await prisma.homepageSection.findMany({ where: { branchId: sourceBranchId } });
        for (const r of rows) {
          await prisma.homepageSection.upsert({ where: { key_branchId: { key: `${r.key}-${targetBranchId.slice(0, 6)}`, branchId: targetBranchId } }, create: { branchId: targetBranchId, key: `${r.key}-${targetBranchId.slice(0, 6)}`, title: r.title, subtitle: r.subtitle, body: r.body, order: r.order, visible: r.visible, status: 'draft', settings: r.settings, createdBy: auth.session!.username, updatedBy: auth.session!.username }, update: {} });
          count++;
        }
        break;
      }
    }
    if (count > 0) results[collection] = count;
  }

  await auditLog({ action: 'cloned_branch', entityType: 'Branch', entityId: targetBranchId, summary: `Cloned ${Object.values(results).reduce((a, b) => a + b, 0)} records from ${sourceBranchId}`, userId: auth.session!.userId, request });
  return NextResponse.json({ ok: true, results });
}
