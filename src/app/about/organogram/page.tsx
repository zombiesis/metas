import { RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const pages = await readCMSCollection<Record<string, any>>('pages');
  const page = pages.organogram || {};
  return <><section className="pagehero"><div className="wrap"><p className="eyebrow">Governance</p><h1>{page.title || 'Organogram'}</h1><p>{page.summary}</p></div></section><section className="section"><div className="wrap"><article className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></article></div></section></>;
}
