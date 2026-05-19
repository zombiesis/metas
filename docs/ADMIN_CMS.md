# Admin CMS Architecture

This project now uses a database-backed enterprise CMS flow. The earlier JSON files under `content/cms` are retained only as seed/input data and emergency fallback for public rendering when the database has not been initialized.

## Admin experience

Admins edit content through normal CMS forms, not raw JSON.

Key routes:

- `/admin/dashboard`
- `/admin/homepage`
- `/admin/pages`
- `/admin/programs`
- `/admin/notices`
- `/admin/documents`
- `/admin/faculty`
- `/admin/media`
- `/admin/forms`
- `/admin/admissions`
- `/admin/placements`
- `/admin/events`
- `/admin/blogs`
- `/admin/careers`
- `/admin/users`
- `/admin/roles`
- `/admin/audit-logs`
- `/admin/security`
- `/admin/analytics`
- `/admin/settings`

## Database

Prisma models live in `prisma/schema.prisma`. The seed script imports the previous project content into database tables.

Run:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Security

Included:

- bcrypt password hashing
- HTTP-only admin session cookies
- login throttling
- account lockout
- role-aware API authorization
- audit logs
- security events
- upload restrictions
- security headers

## Production requirements

Use PostgreSQL and persistent object storage for uploaded files. Cloudflare/WAF protection is required for DDoS-layer defense.
