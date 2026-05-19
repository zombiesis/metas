import { readFile, writeFile } from 'node:fs/promises';

const staticRoutes = [
  '/', '/about', '/about/directors-message', '/about/education-policy', '/about/governing-body', '/about/organogram', '/about/legal-compliance',
  '/academics', '/admissions', '/admissions/apply', '/admissions/cancellation-policy', '/faculty', '/placements', '/infrastructure',
  '/iqac-accreditation', '/student-corner', '/research', '/media', '/media/events', '/media/gallery', '/media/videos', '/alumni',
  '/careers/current-openings', '/contact'
];
const programs = JSON.parse(await readFile('content/cms/programs.json','utf8')).map((p) => `/academics/${p.slug}`);
const valueAdded = JSON.parse(await readFile('content/cms/value-added-courses.json','utf8')).map((p) => `/academics/value-added/${p.slug}`);
const routes = [...new Set([...staticRoutes, ...programs, ...valueAdded])];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>https://suratcollege.metasofsda.in${r}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile('public/sitemap.xml', xml);
console.log(`Generated public/sitemap.xml with ${routes.length} routes.`);
