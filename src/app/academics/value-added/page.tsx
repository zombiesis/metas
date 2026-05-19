import { Section, ValueAddedCards } from '@/components/Blocks';
import { readCMSCollection, type ValueAddedCourse } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

export default async function ValueAdded() {
  const courses = await readCMSCollection<ValueAddedCourse[]>('value-added-courses');
  return <Section eyebrow="Value-added courses" title="Skill and digital learning resources."><ValueAddedCards courses={courses} /></Section>;
}
