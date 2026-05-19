# Production Deployment Guide

## Recommended architecture

- Cloudflare DNS/CDN/WAF in front of the app.
- Next.js app hosted on Vercel, Render, Railway, DigitalOcean App Platform, or a managed VPS.
- PostgreSQL database.
- Persistent media storage: S3, Cloudinary, DigitalOcean Spaces, or equivalent.
- Daily database backups.
- Object storage backups/versioning.

## Production environment variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/metas_cms?schema=public"
ADMIN_SESSION_SECRET="long-random-secret-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="https://suratcollege.metasofsda.in"
TURNSTILE_SECRET_KEY="..."
FORMS_NOTIFICATION_EMAIL="principalcollege@metasofsda.in"
```

## Deployment steps

1. Configure PostgreSQL.
2. Update Prisma provider for production or use the included PostgreSQL schema template.
3. Run migrations.
4. Seed admin roles and initial content.
5. Configure persistent media storage.
6. Configure email/CRM routing.
7. Configure Cloudflare WAF and caching.
8. Deploy app.
9. Test login, forms, uploads, public pages, sitemap, and redirects.
10. Change default admin credentials.

## Serverless warning

Local file uploads under `public/uploads` are for development only. Serverless deployments do not guarantee persistent file writes. Use object storage in production.
