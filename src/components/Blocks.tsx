'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { AccreditationDocument, FacultyMember, Notice, Program, SiteSettings, ValueAddedCourse } from '@/lib/cms-file';

export function Hero({ title, sub }: { title: string; sub: string }) {
  return (
    <section className="hero" role="banner">
      <div className="wrap">
        <p className="eyebrow">Athwalines, Surat, Gujarat — Established Institution</p>
        <h1>{title}</h1>
        <p className="hero-sub">{sub}</p>
        <div className="actions">
          <Link className="btn gold" href="/admissions/apply">Apply Now →</Link>
          <Link className="btn light" href="/admissions#enquiry">Admission Enquiry 2026-27</Link>
          <Link className="btn light" href="/academics">Explore Programs</Link>
        </div>
      </div>
    </section>
  );
}

export function Section({ eyebrow, title, children, navy = false }: { eyebrow?: string; title: string; children: React.ReactNode; navy?: boolean }) {
  return (
    <section className={navy ? 'section navy' : 'section'}>
      <div className="wrap">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function NoticeBar({ notices }: { notices: Notice[] }) {
  const visible = notices.filter((n) => n.status !== 'archived').slice(0, 7);
  return (
    <div className="notices" role="marquee" aria-label="Latest notices">
      <div className="wrap">
        <strong>📢 Notices</strong>
        <div>
          {visible.map((n) => (
            <a key={`${n.category}-${n.title}`} href={n.url} target="_blank" rel="noreferrer">
              {n.category}: {n.title}
            </a>
          ))}
          {visible.map((n) => (
            <a key={`dup-${n.category}-${n.title}`} href={n.url} target="_blank" rel="noreferrer" aria-hidden="true">
              {n.category}: {n.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProgramCard({ p }: { p: Program }) {
  return (
    <article className="card program">
      <img src={p.image || '/assets/images/campus-life.webp'} alt={`${p.title} program`} />
      <div>
        <p className="eyebrow">{p.category}</p>
        <h3>{p.title}</h3>
        <p>{p.summary}</p>
        <p><b>Duration:</b> {p.duration}</p>
        <p><b>Eligibility:</b> {p.eligibility}</p>
        {p.status.includes('placeholder') && <p className="required">[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]</p>}
        <Link className="btn outline" href={`/academics/${p.slug}`}>View Program →</Link>
      </div>
    </article>
  );
}

export function FacultyGrid({ faculty, limit }: { faculty: FacultyMember[]; limit?: number }) {
  return (
    <div className="grid four">
      {faculty.slice(0, limit || faculty.length).map((m) => (
        <article className="card" key={m.slug || m.name}>
          <img className="portrait" src={m.photo || '/assets/images/campus-life.webp'} alt={`${m.name} profile`} />
          <p className="eyebrow">{m.department || 'Department to be confirmed'}</p>
          <h3>{m.name}</h3>
          <p>{m.qualification || '[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]'}</p>
          <small>{m.designation || m.verification || '[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]'}</small>
        </article>
      ))}
    </div>
  );
}

export function DocumentLibrary({ documents, limit }: { documents: AccreditationDocument[]; limit?: number }) {
  const [search, setSearch] = useState('');
  const [authFilter, setAuthFilter] = useState('All authorities');

  const filtered = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                          (d.description && d.description.toLowerCase().includes(search.toLowerCase()));
    const matchesAuth = authFilter === 'All authorities' || d.authority === authFilter;
    return matchesSearch && matchesAuth;
  }).slice(0, limit || documents.length);

  return (
    <div className="docs">
      <div className="filters">
        <input 
          placeholder="Search documents..." 
          aria-label="Search documents"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          aria-label="Filter by authority"
          value={authFilter}
          onChange={(e) => setAuthFilter(e.target.value)}
        >
          <option>All authorities</option>
          <option>AICTE</option>
          <option>GTU</option>
          <option>GNC</option>
          <option>NAAC</option>
          <option>IQAC</option>
        </select>
      </div>
      {filtered.length > 0 ? filtered.map((d) => (
        <article className="doc" key={d.file || d.slug}>
          <div>
            <h3>{d.title}</h3>
            <p>{d.authority} · {d.documentType} · {d.year}</p>
            <small>{d.status}</small>
          </div>
          <a className="btn outline" href={d.file} target="_blank" rel="noreferrer">Download</a>
        </article>
      )) : (
        <p className="empty-hint" style={{padding: '2rem 0', gridColumn: '1 / -1', textAlign: 'center'}}>No documents found matching your search.</p>
      )}
    </div>
  );
}

export function ValueAddedCards({ courses }: { courses: ValueAddedCourse[] }) {
  return (
    <div className="grid three value-cards">
      {courses.map((c) => (
        <article className="card" key={c.slug}>
          <p className="eyebrow">{c.category}</p>
          <h3>{c.title}</h3>
          <p>{c.summary}</p>
          <p><b>Duration:</b> {c.duration}</p>
          <Link className="btn outline" href={`/academics/value-added/${c.slug}`}>Learn More →</Link>
        </article>
      ))}
    </div>
  );
}

export function AdmissionsForm({ programs }: { programs?: Program[] }) {
  return (
    <form className="form" method="post" action="/api/forms/admissions" id="enquiry">
      <div className="formgrid">
        <label>Program
          <select name="program" required>
            <option value="">Select program</option>
            {(programs || []).map((p) => <option key={p.slug}>{p.title}</option>)}
          </select>
        </label>
        <label>Student Name<input name="studentName" required /></label>
        <label>Parent Name<input name="parentName" /></label>
        <label>Phone<input name="phone" required inputMode="tel" /></label>
        <label>WhatsApp<input name="whatsapp" inputMode="tel" /></label>
        <label>Email<input type="email" name="email" /></label>
        <label>City<input name="city" /></label>
        <label>Current Qualification<input name="qualification" /></label>
      </div>
      <label>Message<textarea name="message" /></label>
      <label className="consent"><input type="checkbox" name="consent" required /> I consent to being contacted by Metas Adventist College.</label>
      <input className="honeypot" name="website" aria-hidden="true" tabIndex={-1} />
      <button className="btn gold" type="submit">Submit Enquiry →</button>
    </form>
  );
}

export function ContactCards({ site }: { site: SiteSettings }) {
  return (
    <div className="grid three">
      <article className="card">
        <h3>Registrar</h3>
        <a href={`tel:${site.phones.registrar}`}>{site.phones.registrar}</a>
        <a href={`mailto:${site.emails.registrar}`}>{site.emails.registrar}</a>
      </article>
      <article className="card">
        <h3>Admissions</h3>
        <a href={`tel:${site.phones.admissions.replace(/\s/g, '')}`}>{site.phones.admissions}</a>
      </article>
      <article className="card">
        <h3>Placement</h3>
        <a href={`tel:${site.phones.placement}`}>{site.phones.placement}</a>
        <a href={`mailto:${site.emails.placement}`}>{site.emails.placement}</a>
      </article>
    </div>
  );
}

export function RichContent({ html, fallback }: { html?: string; fallback?: string }) {
  const content = html || fallback || '[CONTENT REQUIRED FROM ADMIN — DO NOT INVENT]';
  // Strip script tags and event handlers as defense-in-depth (write path already sanitizes)
  const safe = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/\son\w+\s*=/gi, ' data-removed=');
  return <div className="content" dangerouslySetInnerHTML={{ __html: safe }} />;
}

export function SourceLinks({ urls }: { urls?: string[] }) {
  if (!urls?.length) return null;
  return (
    <div className="sourcebox">
      <h3>Source-backed content</h3>
      <p>This page has been seeded from live-site or document-backed content.</p>
      <ul>{urls.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul>
    </div>
  );
}

export function DetailList({ items }: { items: Array<[string, string | undefined]> }) {
  return (
    <dl className="detail-list">
      {items.filter(([, v]) => Boolean(v)).map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}


/** Render page builder blocks from metadata JSON */
export function PageBlockRenderer({ metadata }: { metadata: string }) {
  let blocks: any[] = [];
  try { const parsed = JSON.parse(metadata); blocks = parsed.blocks || []; } catch { return null; }
  if (!blocks.length) return null;

  return (
    <div className="page-blocks">
      {blocks.filter((b: any) => b.visible !== false).sort((a: any, b: any) => a.order - b.order).map((block: any) => (
        <section key={block.id} className={`block block-${block.type}`}>
          {block.type === 'hero' && <div className="pagehero"><div className="wrap"><h1>{block.data.title}</h1>{block.data.subtitle && <p>{block.data.subtitle}</p>}{block.data.cta && <a className="btn gold" href={block.data.ctaUrl || '#'}>{block.data.cta}</a>}</div></div>}
          {block.type === 'text' && <div className="section"><div className="wrap">{block.data.heading && <h2>{block.data.heading}</h2>}<div className="content" dangerouslySetInnerHTML={{ __html: (block.data.body || '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') }} /></div></div>}
          {block.type === 'cta' && <div className="section" style={{ textAlign: 'center' }}><div className="wrap"><h2>{block.data.heading}</h2>{block.data.description && <p>{block.data.description}</p>}<a className={`btn ${block.data.variant === 'outline' ? 'outline' : 'gold'}`} href={block.data.buttonUrl}>{block.data.buttonText}</a></div></div>}
          {block.type === 'stats' && <div className="section"><div className="wrap">{block.data.heading && <h2>{block.data.heading}</h2>}<div className="kpi-grid">{(block.data.items || []).map((s: any, i: number) => <div key={i} className="kpi-card"><span className="kpi-value">{s.value}{s.suffix || ''}</span><span className="kpi-label">{s.label}</span></div>)}</div></div></div>}
          {block.type === 'faq' && <div className="section"><div className="wrap">{block.data.heading && <h2>{block.data.heading}</h2>}<div>{(block.data.items || []).map((f: any, i: number) => <details key={i}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</div></div></div>}
          {block.type === 'gallery' && <div className="section"><div className="wrap">{block.data.heading && <h2>{block.data.heading}</h2>}<div className="grid two">{(block.data.images || []).map((img: any, i: number) => <figure key={i}><img src={img.url} alt={img.alt || ''} loading="lazy" />{img.caption && <figcaption>{img.caption}</figcaption>}</figure>)}</div></div></div>}
          {block.type === 'video' && <div className="section"><div className="wrap">{block.data.heading && <h2>{block.data.heading}</h2>}<div style={{ position: 'relative', paddingBottom: '56.25%' }}><iframe src={block.data.url} style={{ position: 'absolute', width: '100%', height: '100%' }} allowFullScreen title={block.data.heading || 'Video'} /></div></div></div>}
          {block.type === 'testimonial' && <div className="section"><div className="wrap">{block.data.heading && <h2>{block.data.heading}</h2>}<div className="grid two">{(block.data.items || []).map((t: any, i: number) => <blockquote key={i} className="card"><p>"{t.quote}"</p><footer><strong>{t.name}</strong>{t.role && <span> — {t.role}</span>}</footer></blockquote>)}</div></div></div>}
          {block.type === 'cards' && <div className="section"><div className="wrap">{block.data.heading && <h2>{block.data.heading}</h2>}<div className="grid two">{(block.data.items || []).map((c: any, i: number) => <article key={i} className="card">{c.image && <img src={c.image} alt={c.title} loading="lazy" />}<h3>{c.title}</h3>{c.description && <p>{c.description}</p>}{c.link && <a href={c.link}>Learn more →</a>}</article>)}</div></div></div>}
        </section>
      ))}
    </div>
  );
}
