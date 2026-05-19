import { RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection, type FacultyMember } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Research() {
  const [pages, faculty] = await Promise.all([
    readCMSCollection<Record<string, any>>('pages'),
    readCMSCollection<FacultyMember[]>('faculty')
  ]);
  const research = pages.research || {};
  const draftProfiles = faculty.filter((member) => member.status === 'draft' || /Research & Development Data/i.test(member.verification || ''));
  return <><section className="pagehero"><div className="wrap"><p className="eyebrow">R&D</p><h1>{research.title || 'Research & Development'}</h1><p>{research.summary || '[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]'}</p></div></section><section className="section"><div className="wrap"><article className="card"><RichContent html={research.body} /><SourceLinks urls={research.sourceUrls} /></article><h2>Research profile records to verify</h2><div className="grid three">{draftProfiles.map((member) => <article className="card" key={member.slug || member.name}><h3>{member.name}</h3><p>{member.qualification}</p><p className="required">{member.verification || 'Admin verification required before public faculty display.'}</p></article>)}</div></div></section></>;
}
