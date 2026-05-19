# Metas Adventist College Enterprise CMS Upgrade

This package upgrades the existing Metas Adventist College build into a database-backed, admin-editable, enterprise CMS platform. It preserves the prior public website structure, assets, routes, PDFs, sitemap, and content safeguards while replacing the weak JSON-admin experience with normal CMS forms.

## What changed

- v4 real-content patch: migrated live-site Institute Details, Director's Message, Education Policy, Principal/AQAR context, legal identity, MBA/BBA/GNM rules, cancellation policy, placement cell, IQAC report structure, R&D and Student Corner context into CMS-managed pages.
- Added `docs/REAL_CONTENT_PATCH.md` and `docs/CONTENT_SOURCE_MAP.csv` so admins can see exactly where each real content block came from.
- Added `/about/legal-compliance` for document-backed legal/accreditation guardrails.
- Fixed Tailwind v4/PostCSS configuration with `@tailwindcss/postcss` and `@import "tailwindcss"`.
- Added Prisma database schema and seed pipeline.
- Added enterprise admin dashboard at `/admin/dashboard`.
- Added visual homepage editor at `/admin/homepage`.
- Added normal CMS managers for pages, programs, notices, documents, faculty, media, forms, admissions, placements, alumni, contacts, events, blogs, careers, users, roles, audit logs, security, analytics, and settings.
- Added HTTP-only cookie admin sessions, bcrypt password hashing, login throttling, account lockout, role permissions, audit logs, security event logs, upload restrictions, and security headers.
- Added form submission storage, CRM-lite admissions leads, CSV export, analytics events, and media upload handling.

## Local setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open the public site:

```text
http://localhost:3000
```

Open admin:

```text
http://localhost:3000/admin/login
```

Development credentials after seeding:

```text
Username: admin
Password: metas-admin-change-me
```

Change this immediately for production.

## Production stack

Recommended:

- Next.js App Router
- PostgreSQL
- Prisma
- Cloudflare WAF/CDN/DDoS protection
- S3/Cloudinary/DigitalOcean Spaces for uploads
- Vercel, Render, Railway, DigitalOcean App Platform, or a managed Node server

SQLite is included for development. For production, use PostgreSQL and follow `docs/DEPLOYMENT_GUIDE.md`.

## Required commands before handoff testing

```bash
npm install
npm run db:push
npm run db:seed
npm run typecheck
npm run build
```

## Notes

This ZIP intentionally keeps all official-contact and compliance content safeguards. Missing or unverified content remains marked as:

```text
[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]
```
