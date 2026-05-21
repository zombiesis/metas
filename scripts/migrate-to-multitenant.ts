/**
 * Migration script: Creates a default branch and backfills all existing content with its branchId.
 * Run with: npx tsx scripts/migrate-to-multitenant.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏗️  Multi-tenant migration: creating default branch...');

  // 1. Create default branch
  const branch = await prisma.branch.upsert({
    where: { slug: 'main' },
    create: { name: 'Metas Adventist College', slug: 'main', status: 'active' },
    update: {},
  });
  console.log(`✅ Branch created: ${branch.name} (${branch.id})`);

  // 2. Create default domain mapping
  await prisma.branchDomain.upsert({
    where: { domain: 'localhost' },
    create: { branchId: branch.id, domain: 'localhost', isPrimary: true },
    update: {},
  });
  console.log('✅ Domain mapped: localhost → main');

  // 3. Create default branch settings
  await prisma.branchSettings.upsert({
    where: { branchId: branch.id },
    create: { branchId: branch.id, tagline: 'Values-Based Higher Education' },
    update: {},
  });
  console.log('✅ Branch settings created');

  // 4. Assign all existing users to default branch
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    await prisma.userBranch.upsert({
      where: { userId_branchId: { userId: user.id, branchId: branch.id } },
      create: { userId: user.id, branchId: branch.id },
      update: {},
    });
  }
  console.log(`✅ ${users.length} user(s) assigned to default branch`);

  // 5. Backfill branchId on all content tables
  const tables = [
    'page', 'homepageSection', 'program', 'faculty', 'notice', 'document',
    'mediaAsset', 'event', 'blogPost', 'jobOpening', 'formSubmission',
    'admissionLead', 'recruiterInquiry', 'alumniRegistration', 'contactInquiry', 'siteSetting',
  ] as const;

  for (const table of tables) {
    const result = await (prisma[table] as any).updateMany({
      where: { branchId: null },
      data: { branchId: branch.id },
    });
    if (result.count > 0) console.log(`  📝 ${table}: ${result.count} record(s) updated`);
  }

  console.log('\n🎉 Migration complete! Default branch ID:', branch.id);
  console.log('   Set DEFAULT_BRANCH_ID=' + branch.id + ' in your .env');
}

main()
  .catch((e) => { console.error('❌ Migration failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
