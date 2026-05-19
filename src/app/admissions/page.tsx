import Link from 'next/link';
import { AdmissionsForm, RichContent, Section, SourceLinks } from '@/components/Blocks';
import { readCMSCollection, type Program } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Admissions() {
  const [programs, pages] = await Promise.all([
    readCMSCollection<Program[]>('programs'),
    readCMSCollection<Record<string, any>>('pages')
  ]);
  const admissions = pages.admissions || {};
  return (
    <>
      <section className="pagehero"><div className="wrap"><p className="eyebrow">Admissions 2026-27</p><h1>{admissions.title || 'Apply with clarity.'}</h1><p>{admissions.summary || 'Secure, mobile-first admission pathways for verified programs.'}</p></div></section>
      <Section eyebrow="Admissions context" title="Official links and policy-backed admission guidance"><article className="card"><RichContent html={admissions.body} /><SourceLinks urls={admissions.sourceUrls} /><div className="actions"><Link className="btn gold" href="/admissions/apply">Apply Online</Link><a className="btn outline" href={admissions.quickGuideUrl || '#'} target="_blank" rel="noreferrer">Quick Guide</a></div></article></Section>
      <Section eyebrow="Enquiry" title="Student-first admissions form"><AdmissionsForm programs={programs} /></Section>
      <Section eyebrow="Eligibility" title="Eligibility by program"><div className="grid three">{programs.map((program) => <article className="card" key={program.slug}><h3>{program.title}</h3><p>{program.eligibility}</p><Link className="btn outline" href={`/academics/${program.slug}`}>View details</Link></article>)}</div><p className="required">Fees, dates, scholarships, and exact refund tables require admin approval.</p></Section>
    </>
  );
}
