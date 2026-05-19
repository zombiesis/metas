import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'prisma/schema.prisma',
  'prisma/migrations/0001_enterprise_cms/migration.sql',
  'src/app/admin/dashboard/page.tsx',
  'src/app/admin/homepage/page.tsx',
  'src/app/admin/programs/page.tsx',
  'src/app/admin/documents/page.tsx',
  'src/app/admin/faculty/page.tsx',
  'src/app/admin/media/page.tsx',
  'src/app/admin/analytics/page.tsx',
  'src/app/admin/security/page.tsx',
  'src/app/admin/audit-logs/page.tsx',
  'src/components/admin/AdminCrudClient.tsx',
  'src/components/admin/HomepageEditorClient.tsx',
  'src/components/admin/RichTextEditor.tsx',
  'src/lib/cms-db.ts',
  'src/lib/rbac.ts',
  'src/lib/audit.ts',
  'src/lib/security.ts',
  'middleware.ts',
  'docs/WAF_DDOS_GUIDE.md',
  'docs/ADMIN_USER_GUIDE.md',
  'docs/BACKUP_RECOVERY_GUIDE.md'
];

const missing = required.filter((file) => !existsSync(path.join(root, file)));
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const postcss = readFileSync(path.join(root, 'postcss.config.mjs'), 'utf8');
const globals = readFileSync(path.join(root, 'src/app/globals.css'), 'utf8');

const errors = [];
if (missing.length) errors.push(`Missing files: ${missing.join(', ')}`);
if (existsSync(path.join(root, 'src/components/admin/AdminJsonEditor.tsx'))) errors.push('Legacy AdminJsonEditor.tsx is still present.');
if (!packageJson.dependencies?.['@prisma/client']) errors.push('@prisma/client dependency missing.');
if (!packageJson.devDependencies?.prisma) errors.push('prisma devDependency missing.');
if (!packageJson.devDependencies?.['@tailwindcss/postcss']) errors.push('@tailwindcss/postcss missing.');
if (!postcss.includes('@tailwindcss/postcss')) errors.push('postcss.config.mjs is not Tailwind v4 compatible.');
if (!globals.includes('@import "tailwindcss"')) errors.push('globals.css is not using Tailwind v4 import.');

if (errors.length) {
  console.error('Enterprise upgrade verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Enterprise upgrade verification passed.');
console.log(`Package: ${packageJson.name}@${packageJson.version}`);
console.log(`Verified ${required.length} enterprise CMS files.`);
