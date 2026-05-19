# Metas Adventist College Website Rebuild Package

This is a static front-end build package created from the audit requirements and the provided ZIP asset capture. It is designed as a production-quality UI prototype and implementation starter for Next.js/React or a headless CMS build.

## What is included
- Ivy League / enterprise higher-ed homepage with the requested 17 sections.
- Core page templates: About, Academics/programmes, Admissions, Faculty, Infrastructure, Placements, IQAC/Accreditation, Student Corner, R&D, Media, Alumni, Careers, Contact.
- Search/filter UI for the document center and faculty directory.
- CRM-ready front-end forms with spam honeypot and analytics placeholders.
- Optimized WebP images extracted from the provided ZIP.
- Data exports in `/data` for programmes, faculty, notices, and documents.
- Redirect map, CMS content model, form specifications, and launch checklist in `/docs`.

## How to preview
Run from this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Production notes
- The forms are intentionally front-end only. Connect them to a secure backend before launch.
- Some document links point to live source URLs while PDFs are migrated. Rehost PDFs in the new CMS/media store before production.
- Content marked `[CONTENT REQUIRED FROM ADMIN - DO NOT INVENT]` must not be replaced with fabricated copy.
- No old font files, legacy jQuery, Revolution Slider, or template CSS/JS were copied into this package.
