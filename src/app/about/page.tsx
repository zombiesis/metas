import Link from 'next/link';
import { DetailList, RichContent, SourceLinks } from '@/components/Blocks';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { readCMSCollection, type SiteSettings } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

// FIX #11: Unique page metadata
export const metadata = {
  title: 'About Us',
  description: 'Metas Adventist College, Surat — values-based education since 1998, part of the global Seventh-day Adventist educational network.',
  alternates: { canonical: '/about' },
};

export default async function About() {
  const [pages, site] = await Promise.all([
    readCMSCollection<Record<string, any>>('pages'),
    readCMSCollection<SiteSettings & { principal?: any; legalIdentity?: any }>('site')
  ]);
  const about = pages.about || {};
  const principal = site.principal || {};
  const legal = site.legalIdentity || {};
  return (
    <>
      <Breadcrumbs items={[{ label: 'About', href: '/about' }]} />
      <section className="pagehero"><div className="wrap"><p className="eyebrow">Institutional identity</p><h1>{about.title || 'About Metas Adventist College'}</h1><p>{about.summary}</p></div></section>
      <section className="section"><div className="wrap twocol"><div>
        <RichContent html={about.body} />
        <SourceLinks urls={about.sourceUrls} />
      </div><aside className="card">
        <h2>Principal context</h2>
        <DetailList items={[
          ['Name', principal.name],
          ['Designation', principal.designation],
          ['Email', principal.email],
          ['Office phone', principal.phone],
          ['Verification', principal.verificationStatus]
        ]} />
        <p className="required">Admin must confirm which principal phone/mobile details should be displayed publicly.</p>
      </aside></div></section>
      <section className="section navy"><div className="wrap"><p className="eyebrow">Legal guardrails</p><h2>Document-backed public identity</h2><div className="grid three">
        <article className="card"><h3>Minority institution</h3><p>{legal.minorityInstitution || '[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]'}</p></article>
        <article className="card"><h3>Trust / unit</h3><p>{legal.trust || site.organization}</p></article>
        <article className="card"><h3>NAAC wording</h3><p>{legal.naacHistoricalNote || 'Admin must verify current accreditation validity before claims.'}</p></article>
      </div><div className="actions"><Link className="btn gold" href="/about/directors-message">Director’s Message</Link><Link className="btn light" href="/about/education-policy">Education Policy</Link><Link className="btn light" href="/about/legal-compliance">Legal & Compliance</Link></div></div></section>
    </>
  );
}
