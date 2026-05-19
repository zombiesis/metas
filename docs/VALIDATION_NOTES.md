# Validation Notes

## Completed in this handoff

- Existing ZIP inspected and upgraded in place.
- Tailwind v4/PostCSS configuration patched to use `@tailwindcss/postcss`.
- JSON content files validated successfully.
- Alias imports checked for missing local files.
- Admin route inventory checked.
- API route inventory checked.
- Raw JSON editor component removed from the admin UI.
- Prisma schema, migration folder, seed script, and production PostgreSQL schema template added.

## Commands to run in the target developer environment

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run typecheck
npm run build
npm run dev
```

## Sandbox limitation

Dependency installation could not complete in this sandbox due DNS resolution errors while fetching npm packages (`EAI_AGAIN` from registry.npmjs.org). The project is packaged with the correct `package.json`, Prisma schema, and setup commands so it can be installed and built in a normal networked Node environment.
