import { DocumentLibrary, RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection, type AccreditationDocument } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function LegalCompliance() {
  const [pages, documents] = await Promise.all([
    readCMSCollection<Record<string, any>>('pages'),
    readCMSCollection<AccreditationDocument[]>('documents')
  ]);
  const page = pages.legalCompliance || {};
  const legalDocs = documents.filter((doc) => ['governance','mandatory-disclosure','student-support','naac','approvals','iqac'].includes(doc.category));
  return <><section className="pagehero"><div className="wrap"><p className="eyebrow">Legal & compliance</p><h1>{page.title || 'Legal & Compliance Identity'}</h1><p>{page.summary}</p></div></section><section className="section"><div className="wrap"><article className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></article><h2>Compliance documents</h2><DocumentLibrary documents={legalDocs} /></div></section></>;
}
