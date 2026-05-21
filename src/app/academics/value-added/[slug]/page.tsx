import { notFound } from 'next/navigation';
import { readCMSCollection, type ValueAddedCourse } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

// NOTE: `generateStaticParams` is intentionally NOT exported. This route is
// force-dynamic and the CMS readers call `headers()` (disallowed at build time).

export default async function ValueAddedDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const courses = await readCMSCollection<ValueAddedCourse[]>('value-added-courses');
  const course = courses.find((item) => item.slug === slug);
  if (!course) notFound();
  return (
    <>
      <section className="pagehero"><div className="wrap"><p className="eyebrow">{course.category}</p><h1>{course.title}</h1><p>{course.summary}</p></div></section>
      <section className="section"><div className="wrap"><article className="card"><h2>Course Details</h2><p><b>Duration:</b> {course.duration}</p><p><b>Eligibility:</b> {course.eligibility}</p><p className="required">[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT] Add current schedule, certificate partner, fees, and coordinator before launch.</p></article></div></section>
    </>
  );
}
