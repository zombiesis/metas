# Developer Setup Guide

## Requirements

- Node.js 20+
- npm 10+
- SQLite for local development
- PostgreSQL for production

## Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Important routes

- `/` public homepage
- `/admin/login` admin login
- `/admin/dashboard` admin dashboard
- `/admin/homepage` visual homepage editor
- `/admin/programs` program manager
- `/admin/documents` document manager
- `/admin/admissions` admissions CRM-lite
- `/admin/security` security dashboard
- `/admin/analytics` analytics dashboard

## Database

Development uses SQLite:

```env
DATABASE_URL="file:./dev.db"
```

Production should use PostgreSQL. A PostgreSQL schema template is included at `prisma/schema.postgresql.prisma`.

## Seeding

The seed script imports existing ZIP content from `content/cms/*.json` into Prisma models and creates the first Super Admin user.

```bash
npm run db:seed
```

## Build

```bash
npm run typecheck
npm run build
```
