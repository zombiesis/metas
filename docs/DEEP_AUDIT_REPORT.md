# Deep Code Audit Report — Round 2

Date: 2026-05-19

## Summary

This audit goes beyond the initial 5 findings. The project has strong security fundamentals but has gaps in input validation coverage, data access efficiency, accessibility, and build tooling.

---

## 1. API Security

### What's Good
- All admin routes use `requireAdminApi()` — no unprotected admin endpoints.
- Public form routes have rate limiting (20 req/15min per IP), honeypot field, consent validation, and `safeString` sanitization.
- CMS write routes use Zod validation + `sanitize-html` for rich text fields.
- Media upload validates file extension, MIME type prefix, and size (15 MB max).
- CSV export strips `passwordHash` before output.
- Login: rate limiting (8 attempts/15min), account lockout after 8 failures, timing-safe token comparison, session fingerprinting, geo-anomaly logging.

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| 1 | Medium | `analytics/track` route accepts arbitrarily long `event`, `path`, `label`, `value` strings — no length validation. Could be abused to bloat the database. |
| 2 | Medium | `csvEscape` doesn't prevent CSV injection. Cells starting with `=`, `+`, `-`, `@` can execute formulas when opened in Excel. |
| 3 | Medium | `safeString()` only trims — no length cap. Fields stored without Zod schemas have no size limit. |
| 4 | Medium | Collections without Zod schemas (events, blogs, careers, media, forms, admissions, recruiters, alumni, contacts) pass through `validateInput()` without any validation — arbitrary JSON is accepted. |
| 5 | Low | `canUseDevFallbackLogin()` exists in `admin-auth.ts` but is never called from the login route — dead code. |

---

## 2. Data Access Patterns

### What's Good
- Prisma singleton pattern is correct (global var in dev, single instance in prod).
- All queries use `.catch(() => fallback)` for resilience.
- No N+1 queries — `include` is used for relations.
- Soft-delete implemented for pages, programs, notices.

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| 6 | Medium | `readAdminCollection` loads ALL records for events, blogs, careers, media (no `take` limit). Will degrade at scale. |
| 7 | Medium | Admin CMS GET route loads all records via `readAdminCollection`, then paginates in JS (`filter → slice`) instead of using Prisma `skip`/`take`. Inefficient for large datasets. |
| 8 | Medium | `readCMSCollection('analytics-events')` loads 1000 records into memory on every call. |
| 9 | High | **Soft-deleted records show publicly.** `getPrograms()` and `getNotices()` don't filter `deletedAt IS NULL`. Deleted content remains visible on the public site. |
| 10 | Low | Session cleanup relies on manual `admin:cleanup` script — no automatic expired session pruning. Stale sessions accumulate. |
| 11 | Low | No additional database indexes beyond schema defaults on frequently filtered fields. |

---

## 3. Build & Config

### What's Good
- `tsconfig.json` has `strict: true`.
- Tailwind v4 with `@tailwindcss/postcss` — correct modern setup.
- Most dependencies use exact versions (pinned).
- Vitest config is functional with path aliases.

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| 12 | Medium | No ESLint config file exists despite `eslint-config-next` in devDeps. `npm run lint` fails. |
| 13 | Medium | `dangerouslySetInnerHTML` on careers page renders `job.description` from DB without read-path sanitization. Write-path sanitizes, but direct DB imports or compromise could inject XSS. |
| 14 | Low | `@playwright/test` and `vitest` use `^` ranges — could break on minor updates. |
| 15 | Low | `next.config.mjs` doesn't set `poweredByHeader: false` (minor info leak, though middleware handles other headers). |

---

## 4. Accessibility & Runtime

### What's Good
- Skip-to-content link in layout.
- All `<img>` elements have `alt` attributes.
- `aria-label` used on icon buttons, nav elements, landmarks.
- `role="alert"` on error messages and toasts.
- All `setInterval`/`setTimeout` have proper cleanup in `useEffect` returns.

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| 16 | High | **Homepage inquiry form inputs lack visible `<label>` elements** — only placeholders used. Violates WCAG 2.1 (1.3.1, 3.3.2). Contact page has proper labels. |
| 17 | Medium | Admin search inputs and command palette input lack visible labels (placeholder-only). |
| 18 | Low | `CounterAnimation` — `setInterval` inside IntersectionObserver callback isn't cleaned on unmount (self-terminates, so minor). |
| 19 | Low | `AdminCrudClient` uses `window.location.reload()` after bulk actions with `setTimeout(500ms)` — fragile race condition pattern. |
| 20 | Low | No focus management after form submissions or modal opens in some admin components. |

---

## Priority Fixes

### Critical (fix before production)
1. **#9** — Filter `deletedAt` in `getPrograms()` and `getNotices()` public queries.
2. **#16** — Add visible `<label>` elements to homepage inquiry form.

### High (fix soon)
3. **#4** — Add Zod schemas for remaining collections (events, blogs, careers, etc.).
4. **#1** — Add length validation to analytics/track route fields.
5. **#7** — Implement server-side pagination with Prisma `skip`/`take` in admin CMS GET.
6. **#13** — Sanitize `job.description` on read path (or use a sanitizing render component).

### Medium (improve quality)
7. **#2** — Prefix CSV cells with `'` or tab to prevent formula injection.
8. **#12** — Create `eslint.config.mjs` for the flat config format (ESLint 9+).
9. **#6** — Add `take` limits to unbounded `readAdminCollection` queries.
10. **#17** — Add `aria-label` or visible labels to admin search inputs.

### Low (nice to have)
11. **#5** — Remove dead `canUseDevFallbackLogin` code.
12. **#10** — Add a cron/scheduled task for expired session cleanup.
13. **#14** — Pin `@playwright/test` and `vitest` versions.
14. **#15** — Add `poweredByHeader: false` to next.config.
15. **#18-20** — Minor runtime/UX improvements.
