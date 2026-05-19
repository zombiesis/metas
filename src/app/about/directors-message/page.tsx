import { DetailList, RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection, type SiteSettings } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [pages, site] = await Promise.all([
    readCMSCollection<Record<string, any>>('pages'),
    readCMSCollection<SiteSettings & { principal?: any }>('site')
  ]);
  const page = pages.directorsMessage || {};
  const principal = site.principal || {};
  return (
    <>
      <section className="pagehero"><div className="wrap"><p className="eyebrow">Leadership communication</p><h1>{page.title || "Director's Message"}</h1><p>{page.summary}</p></div></section>
      <section className="section"><div className="wrap twocol"><div className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></div><aside className="card">
        <img className="portrait" src="/assets/images/director-placeholder-verified-source.webp" alt="Principal profile placeholder" />
        <h2>{page.leaderName || principal.name || 'Principal'}</h2>
        <DetailList items={[
          ['Designation', page.leaderDesignation || principal.designation],
          ['Official email', principal.email],
          ['AQAR source', principal.source]
        ]} />
      </aside></div></section>
    </>
  );
}
