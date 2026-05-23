import { FacultyGrid, Section } from '@/components/Blocks';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { readCMSCollection, type FacultyMember } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

// FIX #11: Unique page title and description for SEO
export const metadata = {
  title: 'Faculty Directory',
  description: 'Meet the qualified faculty of Metas Adventist College — searchable directory of teaching staff across Management, Nursing, and Administration.',
  alternates: { canonical: '/faculty' },
};

export default async function Faculty() {
  const faculty = await readCMSCollection<FacultyMember[]>('faculty');
  const published = faculty.filter((member) => member.status !== 'archived');
  const publicProfiles = published.filter((member) => member.status !== 'draft');
  const draftProfiles = published.filter((member) => member.status === 'draft');
  return (
    <>
      <Breadcrumbs items={[{ label: 'Faculty', href: '/faculty' }]} />
      <Section eyebrow="Faculty Directory" title="Searchable, filterable profiles with verified qualifications only.">
        <div className="filters">
          <input placeholder="Search faculty" aria-label="Search faculty" />
          <select aria-label="Filter faculty by department">
            <option>All departments</option>
            <option>Administration</option>
            <option>Management</option>
            <option>Nursing</option>
          </select>
        </div>
        <FacultyGrid faculty={publicProfiles} />
      </Section>
      {draftProfiles.length > 0 && (
        <Section eyebrow="Research records to verify" title="Draft profiles migrated from live R&D data">
          <div className="grid three">
            {draftProfiles.map((member) => (
              <article className="card" key={member.slug || member.name}>
                <h3>{member.name}</h3>
                <p>{member.qualification}</p>
                <p className="required">{member.verification || 'Admin verification required.'}</p>
              </article>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
