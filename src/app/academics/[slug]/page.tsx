import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DetailList, DocumentLibrary, RichContent } from '@/components/Blocks';
import { readCMSCollection, type AccreditationDocument, type Program } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

// NOTE: generateStaticParams is intentionally NOT exported here. This route is
// `force-dynamic` (per-request branch resolution), and the CMS readers call
// `headers()` via `getCurrentBranchId()` — which Next.js disallows during
// build-time `generateStaticParams` evaluation.

function matchDocs(program: Program, documents: AccreditationDocument[]) {
  const key = program.title.toLowerCase();
  return documents.filter((doc) => (doc.program || '').toLowerCase().includes(key) || (doc.tags || []).some((tag) => tag.toLowerCase().includes(key)) || (doc.title || '').toLowerCase().includes(key)).slice(0, 8);
}

export default async function ProgramPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [programs, documents] = await Promise.all([
    readCMSCollection<Program[]>('programs'),
    readCMSCollection<AccreditationDocument[]>('documents')
  ]);
  const program = programs.find((item) => item.slug === slug);
  if (!program) notFound();
  const relatedDocs = matchDocs(program, documents);
  return (
    <>
      <section className="pagehero"><div className="wrap"><p className="eyebrow">{program.category}</p><h1>{program.title}</h1><p>{program.summary}</p></div></section>
      <section className="section">
        <div className="wrap twocol">
          <div>
            <article className="card"><h2>Overview</h2><p>{program.overview || program.summary}</p><p><strong>Authority note:</strong> {program.authorityNote}</p>{program.status.includes('placeholder') ? <p className="required">[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]</p> : null}</article>
            <article className="card"><h2>Key details</h2><DetailList items={[["Duration", program.duration], ["Eligibility", program.eligibility], ["Status", program.status]]} /></article>
            <article className="card"><h2>Admission process</h2><RichContent html={program.admissionProcess ? `<p>${program.admissionProcess}</p>` : undefined} /></article>
            <article className="card"><h2>Attendance rules</h2><RichContent html={program.attendanceRules ? `<p>${program.attendanceRules}</p>` : undefined} /></article>
            <article className="card"><h2>Semester / course structure</h2><RichContent html={program.semesterStructure ? `<p>${program.semesterStructure}</p>` : undefined} /></article>
            <article className="card"><h2>Official rules migrated from live site</h2><ul>{(program.rules || []).map((rule) => <li key={rule}>{rule}</li>)}</ul></article>
            <article className="card"><h2>Syllabus / Downloads</h2><ul>{(program.documents || []).map((document) => <li key={document}>{document}</li>)}</ul><p className="required">Admin must rehost blocked or HTML-shell syllabus files as clean PDFs before launch.</p></article>
            <article className="card"><h2>Career opportunities</h2><RichContent html={program.careerOpportunities ? `<p>${program.careerOpportunities}</p>` : undefined} /></article>
            <article className="card"><h2>FAQs</h2><ul>{(program.faqs || []).map((faq) => <li key={faq}>{faq}</li>)}</ul></article>
          </div>
          <aside className="card"><h2>Actions</h2><Link className="btn gold" href="/admissions/apply">Apply Now</Link><br /><br /><Link className="btn outline" href="/admissions#prospectus">Download Brochure</Link><br /><br /><Link className="btn outline" href="/faculty">Faculty Directory</Link><p className="required">No eligibility, outcome, or placement claim should be edited without official proof.</p></aside>
        </div>
      </section>
      <section className="section"><div className="wrap"><h2>Related Documents</h2><DocumentLibrary documents={relatedDocs.length ? relatedDocs : documents} limit={8} /></div></section>
    </>
  );
}
