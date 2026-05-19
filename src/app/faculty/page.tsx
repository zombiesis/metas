import { FacultyGrid, Section } from '@/components/Blocks';
import { readCMSCollection, type FacultyMember } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Faculty() {
  const faculty = await readCMSCollection<FacultyMember[]>('faculty');
  const published = faculty.filter((member) => member.status !== 'archived');
  const publicProfiles = published.filter((member) => member.status !== 'draft');
  const draftProfiles = published.filter((member) => member.status === 'draft');
  return <><Section eyebrow="Faculty Directory" title="Searchable, filterable profiles with verified qualifications only."><div className="filters"><input placeholder="Search faculty" aria-label="Search faculty" /><select aria-label="Filter faculty by department"><option>All departments</option><option>Administration</option><option>Management</option><option>Nursing</option></select></div><FacultyGrid faculty={publicProfiles} /><p className="required">Admin must verify designations, expertise, bios, publications, experience, and contact visibility permissions before public display.</p></Section><Section eyebrow="Research records to verify" title="Draft profiles migrated from live R&D data"><div className="grid three">{draftProfiles.map((member) => <article className="card" key={member.slug || member.name}><h3>{member.name}</h3><p>{member.qualification}</p><p className="required">{member.verification || 'Admin verification required.'}</p></article>)}</div></Section></>;
}
