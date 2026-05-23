import { DocumentLibrary, RichContent, SourceLinks } from '@/components/Blocks';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { readCMSCollection, type AccreditationDocument } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

// FIX #11
export const metadata = {
  title: 'IQAC & Accreditation',
  description: 'AICTE, GTU, NAAC, GNC and VNSGU accreditation documents and IQAC reports for Metas Adventist College, Surat.',
  alternates: { canonical: '/iqac-accreditation' },
};

export default async function IQAC() {
  const [documents, pages] = await Promise.all([
    readCMSCollection<AccreditationDocument[]>('documents'),
    readCMSCollection<Record<string, any>>('pages')
  ]);
  const page = pages.iqacAccreditation || {};
  const currentDocs = documents.filter((doc) => doc.status !== 'archived');
  return <><Breadcrumbs items={[{ label: 'IQAC & Accreditation', href: '/iqac-accreditation' }]} /><section className="pagehero"><div className="wrap"><p className="eyebrow">IQAC / NAAC / Accreditation</p><h1>{page.title || 'Document Center'}</h1><p>{page.summary || 'Searchable compliance library for AICTE, GTU, VNSGU, GNC, NAAC, AQAR, IQAC, and mandatory disclosure.'}</p></div></section><section className="section"><div className="wrap"><article className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></article><div className="grid three"><article className="card"><h3>Authorities</h3><p>AICTE, GTU, VNSGU, GNC, NAAC, IQAC, Internal.</p></article><article className="card"><h3>Mandatory disclosure</h3><p>Must be public, working, and prominent. Admin must replace broken/failed endpoints with clean PDFs.</p></article><article className="card"><h3>NAAC status</h3><p className="required">Do not claim current NAAC accreditation unless current certificate and validity are approved by admin.</p></article></div><DocumentLibrary documents={currentDocs.length ? currentDocs : documents} /></div></section></>;
}
