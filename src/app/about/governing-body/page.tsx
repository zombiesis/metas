import { DocumentLibrary, RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection, type AccreditationDocument } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [pages, documents] = await Promise.all([
    readCMSCollection<Record<string, any>>('pages'),
    readCMSCollection<AccreditationDocument[]>('documents')
  ]);
  const page = pages.governingBody || {};
  const filtered = documents.filter((doc) => ['governance','mandatory-disclosure','naac'].includes(doc.category) || /governing|mandatory|naac/i.test(doc.title));
  return <><section className="pagehero"><div className="wrap"><p className="eyebrow">Governance</p><h1>{page.title || 'Governing Body'}</h1><p>{page.summary}</p></div></section><section className="section"><div className="wrap"><article className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></article><h2>Governance & legal documents</h2><DocumentLibrary documents={filtered.length ? filtered : documents} limit={8} /></div></section></>;
}
