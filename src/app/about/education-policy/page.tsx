import { RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const pages = await readCMSCollection<Record<string, any>>('pages');
  const page = pages.educationPolicy || {};
  return <><section className="pagehero"><div className="wrap"><p className="eyebrow">Institutional philosophy</p><h1>{page.title || 'Education Policy'}</h1><p>{page.summary}</p></div></section><section className="section"><div className="wrap"><article className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></article></div></section></>;
}
