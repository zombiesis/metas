import Link from 'next/link';
import { readCMSCollection, type Program, type SiteSettings } from '@/lib/cms-file';

export async function Footer() {
  const [site, programs] = await Promise.all([
    readCMSCollection<SiteSettings>('site'),
    readCMSCollection<Program[]>('programs')
  ]);
  return (
    <footer className="footer">
      <div className="wrap foot">
        <div>
          <span className="footer-est">★ Est. 1998</span>
          <img src="/assets/images/logos/metas-college-logo-white.png" alt="Metas Adventist College" />
          <p>{site.address}</p>
          <p style={{marginTop: '8px', fontSize: '0.85rem', opacity: 0.6}}>{site.organization}</p>
          <div className="footer-socials">
            <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="footer-social" aria-label="Facebook">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="footer-social" aria-label="Instagram">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="footer-social" aria-label="LinkedIn">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zm2-5a2 2 0 110 4 2 2 0 010-4z"/></svg>
            </a>
          </div>
        </div>
        <div>
          <h2>Quick Links</h2>
          <Link href="/about">About Us</Link>
          <Link href="/admissions">Admissions</Link>
          <Link href="/faculty">Faculty</Link>
          <Link href="/placements">Placements</Link>
          <Link href="/iqac-accreditation">IQAC &amp; Accreditation</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <h2>Programs</h2>
          {programs
            .filter((p) => ['bba', 'mba', 'gnm', 'bca', 'bsc-nursing'].includes(p.slug))
            .map((p) => (
              <Link key={p.slug} href={`/academics/${p.slug}`}>{p.title}</Link>
          ))}
        </div>
        <div className="footer-contact">
          <h2>Contact Us</h2>
          <a href={`tel:${site.phones.registrar}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            {site.phones.registrar}
          </a>
          <a href={`tel:${site.phones.admissions.replace(/\s/g, '')}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            {site.phones.admissions}
          </a>
          <a href={`mailto:${site.emails.principal}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            {site.emails.principal}
          </a>
          <a href={`mailto:${site.emails.placement}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            {site.emails.placement}
          </a>
        </div>
      </div>
      <div className="wrap copyright">
        © {new Date().getFullYear()} Metas Adventist College, Surat. All rights reserved. · Part of the Seventh-day Adventist Educational Network.
      </div>
    </footer>
  );
}
