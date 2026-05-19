# Enterprise CMS Upgrade Changelog

This ZIP is intentionally rooted at `metas-adventist-college-enterprise-cms-upgrade` so it is not confused with the earlier admin starter folder.

## Confirmed changes over the earlier admin starter

- Replaced the Tailwind v3-style PostCSS config with Tailwind v4-compatible `@tailwindcss/postcss`.
- Added Prisma database schema, SQLite development datasource, and PostgreSQL production schema template.
- Added migration files and seed script for roles, users, programs, notices, documents, faculty, homepage sections, pages, analytics, security, and forms.
- Added form-based admin CMS modules for homepage, pages, programs, notices, documents, faculty, media, forms, admissions, placements, events, blogs, careers, users, roles, security, analytics, audit logs, and settings.
- Added normal admin forms, rich text editing controls, draft/publish/archive status, CSV exports, media upload endpoint, lead management, analytics events, audit logs, RBAC helpers, and security event logging.
- Added security middleware and documentation for headers, login throttling, rate limiting, uploads, WAF, DDoS protection, backups, and deployment.
- Kept public pages and assets from the previous build, but public content now reads through the CMS data access layer with database fallback support.

## Not a JSON editor

The old JSON editor component is not present. Admin users interact through forms, tables, buttons, selectors, rich text boxes, upload controls, and dashboards.

## Development login

Username: `admin`
Password: `metas-admin-change-me`

Change these in production.

## v4 Real Institutional Content Patch

- Added live-site institutional content to `content/cms/pages.json` instead of leaving thin placeholder pages.
- Added Principal context from AQAR 2022-2023: Dr. Srikakolli Eliah, Principal, with admin visibility guardrails.
- Added real Director's Message, Education Policy, Institute Details, legal identity and governance context.
- Added full MBA/BBA/GNM rule content from the live course pages into program records.
- Added cancellation/withdrawal policy summary from the live admissions policy.
- Added Placement Cell overview, team, internship process and recruiter contact context.
- Added IQAC/Accreditation page context and document guardrails.
- Added real R&D cell purpose and draft research-profile records from live R&D data.
- Added Content Source Map and Real Content Patch documentation.
- Added `/about/legal-compliance` route and expanded sitemap/redirects.
