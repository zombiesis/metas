# Branch Onboarding Runbook

## Prerequisites
- Super Admin access to the admin panel
- DNS access for the new branch domain
- Logo and branding assets for the new branch

## Steps

### 1. Create the Branch (Admin Panel)

1. Log in as Super Admin
2. Navigate to `/admin/branches`
3. Use the API or admin UI to create a new branch:

```bash
curl -X POST http://localhost:3000/api/admin/branches \
  -H "Content-Type: application/json" \
  -H "Cookie: metas_admin_session=<your-session>" \
  -d '{"name": "Nursing College", "slug": "nursing", "domain": "nursing.metasofsda.in"}'
```

### 2. Configure DNS

Point the branch domain to your server:

```
nursing.metasofsda.in  →  A record  →  <server-ip>
```

If using Cloudflare, enable proxy (orange cloud) for SSL.

### 3. Configure Branding

Update branch settings via API:

```bash
curl -X PUT http://localhost:3000/api/admin/branches \
  -H "Content-Type: application/json" \
  -H "Cookie: metas_admin_session=<your-session>" \
  -d '{
    "id": "<branch-id>",
    "settings": {
      "logo": "/uploads/nursing/logo.png",
      "primaryColor": "#1a5276",
      "accentColor": "#e74c3c",
      "tagline": "Excellence in Nursing Education",
      "footerText": "© 2026 Metas Nursing College"
    }
  }'
```

### 4. Assign Admin Users

Assign existing users to the new branch, or create new branch-specific admins:

```sql
-- Via database (or build admin UI for this)
INSERT INTO "UserBranch" (id, "userId", "branchId")
VALUES (gen_random_uuid(), '<user-id>', '<branch-id>');
```

### 5. Switch to New Branch & Add Content

1. In the admin panel, use the **Branch Switcher** dropdown in the toolbar
2. Select the new branch
3. Start adding content: pages, programs, notices, faculty, etc.

### 6. Verify

- Visit `https://nursing.metasofsda.in` — should show the new branch's content
- Verify logo and colors are correct
- Verify no content from other branches leaks through

## Time Estimate

| Step | Time |
|------|------|
| Create branch | 2 min |
| DNS setup | 5 min (+ propagation) |
| Branding config | 10 min |
| User assignment | 2 min |
| Initial content | 15-30 min |
| **Total** | **~30 minutes** |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Domain not resolving | Check DNS propagation (use `dig` or `nslookup`) |
| Wrong branch content showing | Clear domain cache: restart app or wait 5 min |
| Branch switcher not showing | Need >1 active branch in the database |
| Permission denied on branch create | User needs `manage_branches` permission or Super Admin role |
| Logo not loading | Ensure file is uploaded to `/uploads/<branch-slug>/` path |
