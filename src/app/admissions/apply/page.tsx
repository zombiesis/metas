import { AdmissionsForm } from '@/components/Blocks';
import { readCMSCollection, type Program } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Apply() {
  const programs = await readCMSCollection<Program[]>('programs');
  return <><section className="pagehero"><div className="wrap"><p className="eyebrow">Apply Online</p><h1>Application for UG / PG</h1><p>Prototype form ready for secure backend, spam protection, analytics, CSV export, and CRM routing.</p></div></section><section className="section"><div className="wrap"><AdmissionsForm programs={programs} /></div></section></>;
}
