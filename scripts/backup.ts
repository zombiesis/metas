/**
 * Database backup/restore script.
 * Usage:
 *   npx tsx scripts/backup.ts backup          → creates backup JSON
 *   npx tsx scripts/backup.ts restore <file>  → restores from backup
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync, readFileSync } from 'node:fs';

const prisma = new PrismaClient();

async function backup() {
  console.log('📦 Starting backup...');
  const data = {
    timestamp: new Date().toISOString(),
    users: await prisma.user.findMany(),
    roles: await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } }),
    branches: await prisma.branch.findMany({ include: { domains: true, settings: true } }),
    pages: await prisma.page.findMany(),
    programs: await prisma.program.findMany(),
    notices: await prisma.notice.findMany(),
    documents: await prisma.document.findMany(),
    faculty: await prisma.faculty.findMany(),
    events: await prisma.event.findMany(),
    blogs: await prisma.blogPost.findMany(),
    careers: await prisma.jobOpening.findMany(),
    homepageSections: await prisma.homepageSection.findMany(),
    siteSettings: await prisma.siteSetting.findMany(),
    formSubmissions: await prisma.formSubmission.findMany(),
    admissionLeads: await prisma.admissionLead.findMany(),
    mediaAssets: await prisma.mediaAsset.findMany(),
  };

  const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`✅ Backup saved: ${filename} (${Object.values(data).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0)} records)`);
}

async function restore(file: string) {
  console.log(`🔄 Restoring from ${file}...`);
  const data = JSON.parse(readFileSync(file, 'utf8'));

  // Restore in dependency order
  if (data.roles?.length) {
    for (const r of data.roles) {
      await prisma.role.upsert({ where: { id: r.id }, create: { id: r.id, name: r.name, description: r.description }, update: {} });
    }
    console.log(`  ✓ ${data.roles.length} roles`);
  }

  if (data.users?.length) {
    for (const u of data.users) {
      await prisma.user.upsert({ where: { id: u.id }, create: { ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) }, update: {} }).catch(() => null);
    }
    console.log(`  ✓ ${data.users.length} users`);
  }

  if (data.branches?.length) {
    for (const b of data.branches) {
      await prisma.branch.upsert({ where: { id: b.id }, create: { id: b.id, name: b.name, slug: b.slug, status: b.status }, update: {} }).catch(() => null);
    }
    console.log(`  ✓ ${data.branches.length} branches`);
  }

  const contentTables = ['pages', 'programs', 'notices', 'documents', 'faculty', 'events', 'blogs', 'careers', 'homepageSections', 'siteSettings', 'formSubmissions', 'admissionLeads', 'mediaAssets'];
  for (const table of contentTables) {
    if (data[table]?.length) {
      for (const record of data[table]) {
        await (prisma as any)[table === 'homepageSections' ? 'homepageSection' : table === 'siteSettings' ? 'siteSetting' : table === 'formSubmissions' ? 'formSubmission' : table === 'admissionLeads' ? 'admissionLead' : table === 'mediaAssets' ? 'mediaAsset' : table === 'blogs' ? 'blogPost' : table === 'careers' ? 'jobOpening' : table.slice(0, -1)].create({ data: { ...record, createdAt: new Date(record.createdAt), updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined } }).catch(() => null);
      }
      console.log(`  ✓ ${data[table].length} ${table}`);
    }
  }

  console.log('✅ Restore complete');
}

const [,, cmd, file] = process.argv;
if (cmd === 'backup') backup().finally(() => prisma.$disconnect());
else if (cmd === 'restore' && file) restore(file).finally(() => prisma.$disconnect());
else console.log('Usage: npx tsx scripts/backup.ts backup | restore <file>');
