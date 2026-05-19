import { RichContent, SourceLinks } from '@/components/Blocks';
import { readCMSCollection, type SiteSettings } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Placements() {
  const [site, pages] = await Promise.all([
    readCMSCollection<SiteSettings>('site'),
    readCMSCollection<Record<string, any>>('pages')
  ]);
  const placement = pages.placements || {};
  const team = Array.isArray(placement.team) ? placement.team : [];
  const reps = Array.isArray(placement.studentRepresentatives) ? placement.studentRepresentatives : [];
  return (
    <>
      <section className="pagehero"><div className="wrap"><p className="eyebrow">Placements</p><h1>{placement.title || 'Placement Cell & Recruiter Engagement'}</h1><p>{placement.summary}</p></div></section>
      <section className="section">
        <div className="wrap twocol">
          <div>
            <article className="card"><RichContent html={placement.body || `<p>${placement.overview || ''}</p>`} /><SourceLinks urls={placement.sourceUrls} /></article>
            <article className="card table-card"><h2>Placement Team from live site</h2><table><thead><tr><th>Name</th><th>Designation</th><th>Email</th><th>Phone</th></tr></thead><tbody>{team.map((member: any) => <tr key={member.name}><td>{member.name}</td><td>{member.designation}</td><td>{member.email}</td><td>{member.phone}</td></tr>)}</tbody></table><p className="required">Admin should confirm personal email/phone display consent; public default should use placementcell@metasofsda.in.</p></article>
            <article className="card"><h2>Student representatives</h2><div className="tag-row">{reps.map((rep: string) => <span className="tag" key={rep}>{rep}</span>)}</div><p className="required">Verify current student representatives before publishing as current.</p></article>
          </div>
          <aside className="card"><h2>Placement Contact</h2><p>Interested recruiters may contact the Placement Cell.</p><a href={`mailto:${site.emails.placement}`}>{site.emails.placement}</a><br /><a href={`tel:${site.phones.placement}`}>{site.phones.placement}</a><br /><a href={`tel:${site.phones.placementMobile}`}>{site.phones.placementMobile}</a></aside>
        </div>
      </section>
      <section className="section"><div className="wrap"><form className="form" action="/api/forms/recruiter" method="post"><h2>Recruiter Inquiry</h2><div className="formgrid"><label>Company<input name="company" required /></label><label>Contact person<input name="contactPerson" required /></label><label>Designation<input name="designation" /></label><label>Phone<input name="phone" required /></label><label>Email<input type="email" name="email" required /></label><label>Program interest<input name="programInterest" /></label></div><label>Hiring requirement<textarea name="hiringRequirement" /></label><label className="consent"><input type="checkbox" name="consent" required /> I consent to being contacted.</label><button className="btn gold">Submit</button></form></div></section>
    </>
  );
}
