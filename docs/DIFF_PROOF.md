# Diff Proof

This package was regenerated after the complaint that the prior ZIP looked unchanged.

Visible proof points:

1. Root folder is now `metas-adventist-college-enterprise-cms-upgrade`, not `metas-adventist-college-admin-cms-build`.
2. `package.json` name is `metas-adventist-college-enterprise-cms-upgrade`, version `3.0.0`.
3. `prisma/schema.prisma` and `prisma/migrations/0001_enterprise_cms/migration.sql` are included.
4. `src/components/admin/AdminJsonEditor.tsx` is absent.
5. `src/components/admin/AdminCrudClient.tsx`, `HomepageEditorClient.tsx`, `RichTextEditor.tsx`, and `SiteSettingsEditor.tsx` are present.
6. `/admin/*` routes exist for homepage, programs, notices, documents, faculty, media, forms, admissions, analytics, security, users, roles, and audit logs.
7. `middleware.ts` is included for security headers and admin protection.
8. `docs/WAF_DDOS_GUIDE.md`, `docs/ADMIN_USER_GUIDE.md`, `docs/BACKUP_RECOVERY_GUIDE.md`, and `docs/DEVELOPER_SETUP.md` are included.

Run:

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```
