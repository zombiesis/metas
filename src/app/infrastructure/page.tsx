import { RichContent, SourceLinks } from '@/components/Blocks';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { readCMSCollection, type SiteSettings } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

// FIX #11
export const metadata = {
  title: 'Campus & Infrastructure',
  description: 'Library, labs, auditorium, hostel and other campus facilities at Metas Adventist College, Surat.',
  alternates: { canonical: '/infrastructure' },
};

export default async function Infrastructure() {
  const [site, pages] = await Promise.all([
    readCMSCollection<SiteSettings>('site'),
    readCMSCollection<Record<string, any>>('pages')
  ]);
  const page = pages.infrastructure || {};
  return <><Breadcrumbs items={[{ label: 'Infrastructure', href: '/infrastructure' }]} /><section className="pagehero"><div className="wrap"><p className="eyebrow">Infrastructure</p><h1>{page.title || 'Campus Facilities'}</h1><p>{page.summary}</p></div></section><section className="section"><div className="wrap"><article className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></article><div className="grid four">{site.infrastructure.map((item) => <article className="card" key={item}><h3>{item}</h3><p>CMS-managed facility page. Add verified photos, timings, rules, and accessibility notes.</p><p className="required">[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]</p></article>)}</div></div></section></>;
}
