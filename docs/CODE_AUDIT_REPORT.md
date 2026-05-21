# Code Audit Report

Date: 2026-05-19

## Ratings

| Area | Rating | Score |
| --- | --- | ---: |
| Overall project | Good, not production-ready | 7.0/10 |
| Admin dashboard | Polished, data-light | 7.2/10 |
| Security design | Strong intent, CSP/runtime issues | 7.0/10 |
| Data/CMS architecture | Broad, schema drift risk | 6.8/10 |
| Test/build confidence | Good unit coverage, E2E blocked | 7.0/10 |

## What Works Well

- Next.js App Router CMS is broad and organized, covering pages, programs, notices, documents, faculty, media, CRM forms, admissions, users, roles, audit logs, security, analytics, and settings.
- Admin auth uses HTTP-only sessions, bcrypt, login throttling, account lockout, session expiry, session fingerprinting, and role-based checks.
- Dashboard UI is visually strong with sidebar chrome, KPI cards, charts, activity feed, shortcuts, language toggle, dark mode, notifications, and onboarding tips.
- Core validation and security tests are present and passing.
- Content safeguards are documented, and real institutional content is separated into CMS JSON/data files.

## Critical Findings

### 1. Database schema drift breaks production admin pages

The Prisma schema includes `locale` on `Page`, `Program`, and `Notice`, but the migrations/local SQLite database do not include those columns. This caused repeated runtime errors:

```text
Invalid prisma.program.findMany() invocation:
The column main.Program.locale does not exist in the current database.
```

Evidence:

- `prisma/schema.prisma` defines `Program.locale`.
- `prisma/migrations/20260518_init/migration.sql` creates `Program` without `locale`.
- `/admin/programs` returns a production server error when rendered against the current DB.

Impact: high. Admin content pages can 500 even though `npm run build` exits successfully.

Recommended fix:

- Add a migration that adds missing `locale` columns, or remove those fields from Prisma schema if not needed.
- Run `npm run db:push` or a real migration before production verification.

### 2. Production CSP blocks dashboard styling and external fonts

Production middleware sends a strict CSP:

```text
style-src 'self' 'nonce-...'
```

But the app uses Google Fonts and many React inline `style={{ ... }}` attributes. Browser audit on `next start` showed multiple CSP violations and blocked styles.

Evidence:

- `src/app/layout.tsx` loads `https://fonts.googleapis.com`.
- `src/app/admin/dashboard/page.tsx` uses many inline styles.
- `src/components/admin/BarChart.tsx`, `AdminChrome.tsx`, and several admin components use inline styles.
- Production browser console reported Google Fonts and inline style CSP violations.

Impact: high. Production UI can look degraded or broken while security headers appear enabled.

Recommended fix:

- Prefer `next/font` or self-hosted fonts.
- Move inline styles to CSS classes/CSS variables where practical.
- If inline styles must remain, adjust CSP deliberately, but do not weaken it casually.

### 3. Dashboard displays hard-coded/estimated operational signals

Some dashboard indicators imply live operational intelligence but are static or estimated.

Evidence:

- `src/app/admin/dashboard/page.tsx` shows `Online (estimated)`.
- KPI trends show hard-coded values like `↑ 12%` and `↑ 4`.
- Footer shows `System Status: Optimal` regardless of health results.
- Upcoming events card is placeholder-only rather than querying events.

Impact: medium-high. Admin users may trust misleading operational data.

Recommended fix:

- Wire `/api/health` into dashboard status.
- Compute KPI deltas from current vs previous period.
- Query upcoming events from the `Event` table.
- Label placeholders as placeholders or remove them.

### 4. Admin API authorization order differs from E2E expectation

The E2E test expects cross-origin admin POST to return `403`, but current runtime returns `401` because authentication happens before origin rejection.

Evidence:

- `middleware.ts` checks missing admin session before CSRF origin validation.
- `e2e/admin-login.spec.ts` expects `403` for cross-origin POST.

Impact: medium. Security behavior is acceptable, but tests and implementation disagree.

Recommended fix:

- Decide desired order: unauthenticated cross-origin POST as `401` or CSRF-first as `403`.
- Update either middleware or E2E expectation.

### 5. Production env documentation is inconsistent

Production env docs mention `ADMIN_SESSION_SECRET`, but code requires `SESSION_SECRET`.

Evidence:

- `docs/DEPLOYMENT_GUIDE.md` lists `ADMIN_SESSION_SECRET`.
- `src/lib/env.ts` requires `SESSION_SECRET`.

Impact: medium. Production startup can fail despite following the docs.

Recommended fix:

- Update docs to use `SESSION_SECRET`, or make code support both names.

## Validation Run

Commands executed:

```bash
npm run typecheck
npm test
npm run build
npm run content:check
npm run verify:enterprise
npm run lint
npm run test:e2e
```

Results:

- `npm run typecheck`: passed.
- `npm test`: passed, 69 tests.
- `npm run build`: passed, but logged Prisma schema errors.
- `npm run content:check`: passed.
- `npm run verify:enterprise`: passed.
- `npm run lint`: failed because `next lint` is invalid under the installed Next.js version/CLI behavior.
- `npm run test:e2e`: failed because Playwright browsers are not installed; API-only E2E also found the `403` vs `401` mismatch.

## Final Verdict

This is a strong CMS prototype with good breadth, security ambition, and a polished admin UI. It should not be rated production-ready yet because database schema drift can crash admin pages, production CSP blocks legitimate styling, and some dashboard values are hard-coded/estimated.

Priority order:

1. Fix Prisma schema/migration drift.
2. Fix CSP/font/inline-style compatibility.
3. Replace hard-coded dashboard signals with real metrics.
4. Align E2E tests with intended middleware behavior.
5. Fix production env documentation and lint script.
