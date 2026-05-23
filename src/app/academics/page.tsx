import { ProgramCard, Section } from '@/components/Blocks';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { readCMSCollection, type Program } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

// FIX #11: unique title for SEO
export const metadata = {
  title: 'Degree Programs',
  description: 'BBA, MBA, BCA, B.Sc. Nursing and GNM programs at Metas Adventist College — AICTE approved, GTU and VNSGU affiliated.',
  alternates: { canonical: '/academics' },
};

export default async function Academics() {
  const programs = await readCMSCollection<Program[]>('programs');
  return (
    <>
      <Breadcrumbs items={[{ label: 'Programs', href: '/academics' }]} />
      <Section eyebrow="Academics" title="Program architecture with verification safeguards.">
        <div className="programgrid">
          {programs.map((program) => <ProgramCard key={program.slug} p={program} />)}
        </div>
      </Section>
    </>
  );
}
