# Admin User Guide for Non-Technical Staff

## Login

Go to `/admin/login` and sign in with your assigned username and password.

## Dashboard

The dashboard shows admissions leads, form submissions, active notices, draft pages, documents, security warnings, and recent audit activity.

## Editing the homepage

Go to `/admin/homepage`.

Choose a section on the left, edit title/subtitle/body using normal fields, then click **Save Homepage**.

Use this for:

- Hero headline and subtitle
- Welcome section
- Mission/vision/value presentation notes
- Program block heading
- Why Choose Metas section
- Statistics block heading
- Admissions block heading
- Placement preview
- Faculty spotlight heading
- Infrastructure heading
- Accreditation heading
- News/events/testimonials/footer notes

## Editing programs

Go to `/admin/programs`.

Use **Add New** or select a program from the table. Edit normal fields like duration, eligibility, admission process, attendance rules, documents, FAQs, and SEO.

Do not publish any unverified program as active. Keep missing information as:

`[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]`

## Uploading media

Go to `/admin/media`.

Upload images/PDFs, add title, alt text, and folder. For production, uploaded files must be stored in persistent object storage.

## Managing notices

Go to `/admin/notices`.

Set publish date, expiry date, status, category, URL/PDF, and whether the notice is pinned to the homepage. Expired or old notices should be archived.

## Admissions CRM-lite

Go to `/admin/admissions`.

Filter/search leads, update status, assign owner, set follow-up date, add notes, and export CSV.

## Forms

Go to `/admin/forms` for general submissions. Admission inquiries are also copied into Admissions CRM.

## Security and audit logs

- `/admin/security`: login attempts, security warnings, active sessions, WAF checklist.
- `/admin/audit-logs`: who changed what and when.
