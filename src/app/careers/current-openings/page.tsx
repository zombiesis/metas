import { readCMSCollection } from '@/lib/cms-file';

export const dynamic = 'force-dynamic';

type Job = { id: string; title: string; department?: string; employmentType?: string; deadline?: string; status: string; description?: string; eligibility?: string; noticeUrl?: string; applicationUrl?: string };

export default async function Careers() {
  const jobs = await readCMSCollection<Job[]>('careers');
  const visible = jobs.filter((job) => job.status !== 'archived');
  return (
    <>
      <section className="pagehero"><div className="wrap"><p className="eyebrow">Careers</p><h1>Current Openings</h1><p>CMS-managed active, closed, and archived job notices.</p></div></section>
      <section className="section"><div className="wrap grid two">
        {visible.length ? visible.map((job) => <article className="card" key={job.id}><p className="eyebrow">{job.department || 'HR Department'} · {job.status}</p><h2>{job.title}</h2><p>{job.employmentType}</p><div dangerouslySetInnerHTML={{ __html: job.description || 'Eligibility and detailed advertisement to be added by admin.' }} />{job.noticeUrl ? <a className="btn outline" href={job.noticeUrl}>View notice</a> : null}</article>) : <article className="card"><h2>No active openings</h2><p>[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT] Add current faculty/staff notices through the Careers admin module.</p><a className="btn outline" href="/documents/careers/faculty-requirement-management-bca-nursing-february-2026.pdf">View latest available recruitment PDF</a></article>}
      </div></section>
      <section className="section"><div className="wrap"><form className="form" action="/api/forms/career" method="post"><h2>Career Application</h2><div className="formgrid"><label>Opening<input name="opening" /></label><label>Name<input name="name" required /></label><label>Phone<input name="phone" required /></label><label>Email<input type="email" name="email" required /></label><label>Qualification<input name="qualification" /></label><label>Experience<input name="experience" /></label></div><label>Message<textarea name="message" /></label><label className="consent"><input type="checkbox" name="consent" required /> I consent to HR processing.</label><button className="btn gold">Submit</button></form></div></section>
    </>
  );
}
