import { ProgramCard, Section } from '@/components/Blocks';
import { readCMSCollection, type Program } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function Academics() {
  const programs = await readCMSCollection<Program[]>('programs');
  return <Section eyebrow="Academics" title="Program architecture with verification safeguards."><div className="programgrid">{programs.map((program) => <ProgramCard key={program.slug} p={program} />)}</div></Section>;
}
