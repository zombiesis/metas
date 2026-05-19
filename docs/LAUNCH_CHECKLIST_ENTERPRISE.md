# Enterprise Launch Checklist

## Build and database

- [ ] `npm install` completes.
- [ ] `npm run db:generate` completes.
- [ ] `npm run db:push` or migrations complete.
- [ ] `npm run db:seed` completes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.

## Admin

- [ ] `/admin/login` works.
- [ ] Default password changed.
- [ ] Roles reviewed.
- [ ] Homepage editor saves content.
- [ ] Program manager saves content.
- [ ] Notice manager saves content.
- [ ] Document manager saves content.
- [ ] Faculty manager saves content.
- [ ] Media upload works with production object storage.
- [ ] Audit logs record actions.
- [ ] Security events record failed logins.

## Public website

- [ ] Homepage loads.
- [ ] Program pages load.
- [ ] Admissions forms submit.
- [ ] Contact forms submit.
- [ ] Recruiter/alumni/career forms submit.
- [ ] PDF downloads work.
- [ ] Sitemap exists.
- [ ] Redirect map tested.
- [ ] No placeholder filler text.
- [ ] No fake testimonials.
- [ ] No fake counters.
- [ ] Missing content marked admin required.

## Security

- [ ] HTTPS enabled.
- [ ] Security headers verified.
- [ ] Cloudflare WAF enabled.
- [ ] DDoS protection enabled.
- [ ] Admin route challenge configured.
- [ ] Turnstile/CAPTCHA configured.
- [ ] Backups enabled.
