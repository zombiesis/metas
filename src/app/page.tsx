import Link from 'next/link';
import { getAllCMSContent } from '@/lib/cms-file';
import { sanitizeRichText } from '@/lib/security';
import { HeroSlider } from '@/components/ImageSlider';
import { CounterAnimation } from '@/components/CounterAnimation';
import { TabNoticeBoard } from '@/components/TabNoticeBoard';
import { safeFormatDate, pickEventDate } from '@/lib/utils';

import { t, getServerLocale } from '@/lib/i18n';

export const metadata = {
  title: 'Metas Adventist College, Surat — MBA, BBA, BCA, B.Sc. Nursing, GNM',
  description: 'AICTE approved, GTU affiliated college in Surat. Admissions open for 2026-27.',
};

export const dynamic = 'force-dynamic';

function sectionByKey(sections: any[], key: string) {
  return sections.find((s) => s.key === key && s.visible !== false) || {};
}

export default async function Home() {
  const { site, homepageSections, programs, notices, documents, faculty, events } = await getAllCMSContent();
  const mainPrograms = programs.filter((p) => ['bba', 'mba', 'gnm'].includes(p.slug));
  const hero = sectionByKey(homepageSections, 'hero');
  const welcome = sectionByKey(homepageSections, 'welcome');

  const heroSlides = [
    { title: hero.title || 'Admissions Open 2026-27', subtitle: hero.subtitle || 'MBA / BBA / BCA / B.Sc. Nursing / GNM — Apply now for the upcoming academic year.', image: '/assets/images/campus-hero.webp' },
    { title: 'Metas Adventist College, Surat', subtitle: 'Values-based higher education since 1998 — part of the global Seventh-day Adventist network.', image: '/assets/images/campus-life.webp' },
    { title: '5,590+ Institutions Worldwide', subtitle: 'The SDA Organisation operates educational establishments across the globe, including 114 universities.', image: '/assets/images/values-ceremony.webp' },
  ];

  /* Faculty with initials for avatar fallback */
  const topFaculty = faculty.filter((f) => f.spotlight).slice(0, 7);

  return (
    <>
      {/* ─── 1. HERO ─── */}
      <HeroSlider slides={heroSlides} />

      {/* ─── NEWS TICKER ─── */}
      <div className="notice-ticker">
        <div className="wrap">
          <span className="ticker-label">Updates</span>
          <div className="ticker-track">
            <div className="ticker-content">
              {notices.filter((n) => n.status !== 'archived').slice(0, 5).map((n, i) => (
                <a key={i} href={n.url} target="_blank" rel="noreferrer">
                  {n.pinned && <span className="ticker-new">NEW</span>}
                  <span className="ticker-cat">{n.category}</span> {n.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. ABOUT / LEGACY ─── */}
      <section className="section">
        <div className="wrap about-grid">
          <div>
            <p className="eyebrow">Welcome to Metas Adventist College</p>
            <h2>{welcome.title || 'A Legacy of Excellence Since 1998'}</h2>
            <div className="about-body">
              {welcome.body ? <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(welcome.body) }} /> : <><p>The Metas Group of Institutions is part of the vast array of Educational and Medical institutions run by the Seventh Day Adventist Organisation. Worldwide they operate <strong>5,590 educational establishments</strong> including 114 universities and colleges. The operations of Surat are managed by Medical Educational Trust Association Surat of Seventh-day Adventist. Metas Adventist Hospital and Metas Adventist School have been in operation since 1923 &amp; 1942 respectively.</p></>}
            </div>
            <div className="mvv-cards">
              <div className="mvv-card"><h3>Our Mission</h3><p>&ldquo;{site.mission}&rdquo;</p></div>
              <div className="mvv-card"><h3>Our Vision</h3><p>&ldquo;{site.vision}&rdquo;</p></div>
              <div className="mvv-card"><h3>Core Values</h3><ul>{(site.values || []).map((v) => <li key={v}>{v}</li>)}</ul></div>
            </div>
          </div>
          <aside className="inquiry-form-wrap">
            <h3>Inquiry Form</h3>
            <form className="inquiry-form" method="post" action="/api/forms/admissions">
              <label htmlFor="inq-name">Full Name</label>
              <input id="inq-name" name="studentName" required placeholder="Full Name" />
              <label htmlFor="inq-email">Email</label>
              <input id="inq-email" type="email" name="email" placeholder="email@example.com" />
              <label htmlFor="inq-phone">Phone</label>
              <input id="inq-phone" name="phone" required inputMode="tel" placeholder="+91 98765 43210" />
              <label htmlFor="inq-program">Program</label>
              <select id="inq-program" name="program" required>
                <option value="">Select Program</option>
                <option>MBA</option><option>BBA</option><option>BCA</option><option>B.Sc. Nursing</option><option>GNM</option>
              </select>
              <label htmlFor="inq-message">Message</label>
              <textarea id="inq-message" name="message" placeholder="Your message (optional)" rows={3} />
              <input className="honeypot" name="website" aria-hidden="true" tabIndex={-1} />
              <button type="submit" className="btn gold full">Submit Inquiry</button>
            </form>
            <p className="inquiry-whatsapp">Or WhatsApp us: <a href="https://wa.me/919512644385">+91 95126 44385</a></p>
          </aside>
        </div>
      </section>

      {/* ─── 3. WHY CHOOSE METAS ─── */}
      <section className="section alt">
        <div className="wrap">
          <p className="eyebrow">Advantages</p>
          <h2>Why Choose Metas?</h2>
          <div className="why-grid">
            <div className="why-card"><h3>Global SDA Network</h3><p>Part of the Seventh-day Adventist Organisation operating 5,590 educational establishments and 114 universities worldwide.</p></div>
            <div className="why-card"><h3>AICTE Approved</h3><p>Extension of Approval (EOA) 2026-27 for MBA, BBA &amp; BCA programmes. GTU affiliated since establishment.</p></div>
            <div className="why-card"><h3>Nursing Excellence</h3><p>GNC approved GNM programme. VNSGU affiliated B.Sc. Nursing. Clinical training at Metas Adventist Hospital.</p></div>
            <div className="why-card"><h3>Active Placement Cell</h3><p>Dedicated placement officer. Industry visits, campus drives, and internship support. Contact: 9723555799.</p></div>
            <div className="why-card"><h3>Own Campus</h3><p>Self-financing institution functioning from its own campus at Athwalines, Surat since 1998.</p></div>
            <div className="why-card"><h3>Value-Added Courses</h3><p>Tally certification, IELTS preparation, SWAYAM, MOOCs, and National Digital Library access for all students.</p></div>
          </div>
        </div>
      </section>

      {/* ─── 4. OUR COURSES ─── */}
      <section className="section">
        <div className="wrap">
          <p className="eyebrow">Degree Programs</p>
          <h2>Our Courses</h2>
          <div className="course-grid">
            {mainPrograms.map((p) => (
              <article className="course-card" key={p.slug}>
                <img src={p.image || '/assets/images/campus-life.webp'} alt={p.title} loading="lazy" />
                <div className="course-card-body">
                  <h3><Link href={`/academics/${p.slug}`}>{p.title}</Link></h3>
                  <p className="course-meta">{p.duration} &middot; {p.slug === 'gnm' ? 'GNC / VNSGU' : 'GTU / AICTE'}</p>
                  <Link className="btn outline" href={`/academics/${p.slug}`}>Read More →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. STUDENT RESOURCES ─── */}
      <section className="section alt">
        <div className="wrap">
          <p className="eyebrow">Learning Platforms</p>
          <h2>Platforms &amp; Resources for Students</h2>
          <div className="resource-row">
            <a href="https://swayam.gov.in/" target="_blank" rel="noreferrer" className="resource-card"><img src="/assets/images/logos/swayam.webp" alt="SWAYAM" loading="lazy" /><strong>SWAYAM</strong><span>Free online courses by Govt. of India</span></a>
            <a href="https://www.ugc.gov.in/" target="_blank" rel="noreferrer" className="resource-card"><img src="/assets/images/logos/mooc.webp" alt="MOOCs" loading="lazy" /><strong>MOOCs</strong><span>Massive Open Online Courses</span></a>
            <a href="https://ndl.iitkgp.ac.in/" target="_blank" rel="noreferrer" className="resource-card"><img src="/assets/images/logos/ndli.webp" alt="NDL India" loading="lazy" /><strong>National Digital Library</strong><span>Virtual repository of learning resources</span></a>
            <a href="https://www.britishcouncil.in/exam/ielts" target="_blank" rel="noreferrer" className="resource-card"><img src="/assets/images/logos/gtu.webp" alt="IELTS" loading="lazy" /><strong>IELTS Preparation</strong><span>English proficiency test prep</span></a>
            <a href="https://tallysolutions.com/" target="_blank" rel="noreferrer" className="resource-card"><img src="/assets/images/logos/aicte.webp" alt="Tally" loading="lazy" /><strong>Tally Certification</strong><span>Industry-recognized accounting software</span></a>
          </div>
        </div>
      </section>

      {/* ─── 6. STATS BAR ─── */}
      <section className="stats-bar">
        <div className="wrap">
          <CounterAnimation end={1923} label="Metas Operations Since" suffix="" />
          <CounterAnimation end={25} label="Faculty-Student Ratio 1:" suffix="" />
          <CounterAnimation end={7} label="Programs Offered" suffix="" />
          <CounterAnimation end={95} label="Placement Assistance %" suffix="" />
        </div>
      </section>

      {/* ─── 7. FACULTY ─── */}
      <section className="section">
        <div className="wrap">
          <p className="eyebrow">Our Team</p>
          <h2>Meet the Faculty</h2>
          <div className="faculty-grid">
            {topFaculty.map((f) => {
              const initials = f.name.split(' ').filter((_, i, a) => i === 0 || i === a.length - 1).map((w) => w[0]).join('');
              return (
                <div className="faculty-card" key={f.slug || f.name}>
                  {f.photo ? <img src={f.photo} alt={f.name} className="faculty-photo" loading="lazy" decoding="async" /> : <div className="faculty-avatar">{initials}</div>}
                  <h3>{f.name}</h3>
                  <p className="faculty-role">{f.designation}</p>
                  <p className="faculty-dept">{f.department}</p>
                  {f.qualification && <small>{f.qualification}</small>}
                </div>
              );
            })}
          </div>
          <div className="actions center"><Link className="btn outline" href="/faculty">View All Faculty →</Link></div>
        </div>
      </section>

      {/* ─── 8. NOTICE BOARD + UPCOMING ─── */}
      <section className="section alt">
        <div className="wrap notice-layout">
          <div>
            <p className="eyebrow">Announcements</p>
            <h2>Notice Board</h2>
            <TabNoticeBoard notices={notices} />
          </div>
          <aside>
            <p className="eyebrow">Schedule</p>
            <h2>Upcoming Events</h2>
            <div className="timeline">
              {events && events.filter((e: any) => {
                const d = pickEventDate(e);
                if (!d) return false;
                const dt = new Date(d as string);
                return !Number.isNaN(dt.getTime()) && dt > new Date();
              }).length > 0 ? (
                events
                  .filter((e: any) => {
                    const d = pickEventDate(e);
                    if (!d) return false;
                    const dt = new Date(d as string);
                    return !Number.isNaN(dt.getTime()) && dt > new Date();
                  })
                  .sort((a: any, b: any) => new Date(pickEventDate(a) as string).getTime() - new Date(pickEventDate(b) as string).getTime())
                  .slice(0, 4)
                  .map((e: any) => {
                    const d = new Date(pickEventDate(e) as string);
                    const mon = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
                    const day = d.toLocaleDateString('en-IN', { day: '2-digit' });
                    const yr = d.getFullYear();
                    return (
                      <div className="timeline-item" key={e.id}>
                        <div className="tl-date"><span>{mon} {day}</span><small>{yr}</small></div>
                        <div><strong>{e.title}</strong><p>{e.summary?.substring(0, 60) || ''}</p></div>
                      </div>
                    );
                  })
              ) : (
                <>
                  <div className="timeline-item"><div className="tl-date"><span>JUL 15</span><small>2026</small></div><div><strong>New Student Induction</strong><p>Orientation program for all freshers</p></div></div>
                  <div className="timeline-item"><div className="tl-date"><span>AUG 01</span><small>2026</small></div><div><strong>Semester I Begins</strong><p>Regular classes for all programs</p></div></div>
                  <div className="timeline-item"><div className="tl-date"><span>NOV 20</span><small>2026</small></div><div><strong>GTU Winter Examinations</strong><p>End semester university exams</p></div></div>
                  <div className="timeline-item"><div className="tl-date"><span>MAR 01</span><small>2027</small></div><div><strong>Campus Placement Drive</strong><p>Annual recruitment drive begins</p></div></div>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* ─── 9. EVENTS (Proof of Life) ─── */}
      {events && events.length > 0 && (
        <section className="section">
          <div className="wrap">
            <p className="eyebrow">College Life</p>
            <h2>Events &amp; Achievements</h2>
            <div className="events-grid">
              {events.slice(0, 3).map((e: any) => {
                const dateLabel = safeFormatDate(pickEventDate(e), 'long', '');
                return (
                  <article className="blog-card" key={e.id}>
                    <img src={e.image || '/assets/images/campus-facility.webp'} alt={e.title} loading="lazy" />
                    <div>
                      {dateLabel && <span className="blog-date">{dateLabel}</span>}
                      <h3>{e.title}</h3>
                      <p>{e.summary || (e.body?.length > 100 ? e.body.substring(0, 100) + '...' : e.body) || ''}</p>
                      <Link href={`/media/events/${e.slug || e.id}`}>Read More →</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── 11. AFFILIATIONS ─── */}
      <section className="section alt">
        <div className="wrap">
          <p className="eyebrow">Recognition</p>
          <h2>Affiliations &amp; Accreditation</h2>
          <div className="affil-grid">
            <div className="affil-card"><img src="/assets/images/logos/aicte.webp" alt="AICTE" loading="lazy" /><strong>AICTE EOA 2026-27</strong><span>MBA, BBA &amp; BCA</span><span className="affil-status">Active</span></div>
            <div className="affil-card"><img src="/assets/images/logos/gtu.webp" alt="GTU" loading="lazy" /><strong>GTU Affiliation</strong><span>BBA &amp; MBA 2025-26</span><span className="affil-status">Active</span></div>
            <div className="affil-card"><img src="/assets/images/logos/naac.webp" alt="NAAC" loading="lazy" /><strong>NAAC Accreditation</strong><span>Quality Assessment</span><span className="affil-status">Verified</span></div>
            <div className="affil-card"><div className="faculty-avatar" style={{width:'48px',height:'48px',fontSize:'14px',marginBottom:'12px'}}>GNC</div><strong>GNC Permission</strong><span>GNM &amp; B.Sc. Nursing</span><span className="affil-status">Active</span></div>
            <div className="affil-card"><div className="faculty-avatar" style={{width:'48px',height:'48px',fontSize:'12px',marginBottom:'12px'}}>VNSGU</div><strong>VNSGU Affiliation</strong><span>B.Sc. Nursing</span><span className="affil-status">Active</span></div>
          </div>
          <div className="actions center"><Link className="btn outline" href="/iqac-accreditation">View All Documents →</Link></div>
        </div>
      </section>

      {/* ─── 12. CTA FOOTER ─── */}
      <section className="section cta-dark">
        <div className="wrap cta-grid">
          <div>
            <h2>Start Your Journey — Apply Today</h2>
            <p>Secure your seat in MBA, BBA, BCA, B.Sc. Nursing, or GNM. Admission through ACPC counselling and Management Quota.</p>
            <Link className="btn gold" href="/admissions/apply">Apply Online →</Link>
          </div>
          <div className="cta-contact">
            <h3>Quick Contact</h3>
            <p><a href="tel:9512644385">📞 Admissions: 95126 44385</a></p>
            <p><a href="tel:02617160215">📞 Registrar: 0261-7160215</a></p>
            <p><a href="tel:02617159490">📞 Placement: 0261-7159490</a></p>
            <p><a href="mailto:principalcollege@metasofsda.in">✉️ principalcollege@metasofsda.in</a></p>
            <p className="cta-hours">Mon-Fri: 09:00-13:00 &amp; 15:30-17:30</p>
          </div>
        </div>
      </section>
    </>
  );
}
