import { DocumentLibrary, RichContent, Section, SourceLinks } from '@/components/Blocks';
import { readCMSCollection, type AccreditationDocument } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

const items = ['Academic Calendar', 'Code of Conduct', 'Examination', 'Results', 'Scholarship', 'Student Induction', 'Internship', 'Placement', 'Recruiters', 'MOUs', 'Alumni', 'Activities', 'Anti-Ragging Cell', 'Grievance Cell', 'Women Sexual Harassment Cell', 'Student Monitoring System', 'Newsletter', 'Professional Membership'];

export default async function StudentCorner() {
  const [documents, pages] = await Promise.all([
    readCMSCollection<AccreditationDocument[]>('documents'),
    readCMSCollection<Record<string, any>>('pages')
  ]);
  const page = pages.studentCorner || {};
  const studentDocs = documents.filter((doc) => ['student-support','notices','newsletters','placement'].includes(doc.category));
  return <><section className="pagehero"><div className="wrap"><p className="eyebrow">Student Corner</p><h1>{page.title || 'Student services, notices, and support cells.'}</h1><p>{page.summary}</p></div></section><Section eyebrow="Live-site student support structure" title="Student services and support cells"><article className="card"><RichContent html={page.body} /><SourceLinks urls={page.sourceUrls} /></article><div className="grid four">{items.map((item) => <article className="card" key={item}><h3>{item}</h3><p>CMS-managed page/document area. Current content must be verified by admin.</p></article>)}</div></Section><Section eyebrow="Documents" title="Filtered student documents"><DocumentLibrary documents={studentDocs.length ? studentDocs : documents} limit={10} /></Section></>;
}
