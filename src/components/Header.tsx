import Link from 'next/link';
import { readCMSCollection, type SiteSettings } from '@/lib/cms-file';
import { getBranchTheme } from '@/lib/theme';
import { Navigation } from './MobileNav';

export async function Header() {
  const [site, theme] = await Promise.all([
    readCMSCollection<SiteSettings>('site'),
    getBranchTheme(),
  ]);
  const logoSrc = theme.logo || '/assets/images/logos/metas-college-logo.png';
  return (
    <header className="header">
      <div className="top">
        <div className="wrap">
          <div className="top-left">
            <span>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              {site.phones.admissions}
            </span>
            <span>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              {site.phones.registrar}
            </span>
            <span>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              {site.emails.principal}
            </span>
          </div>
          <div className="top-right">
            <span>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {site.hours}
            </span>
            <Link href="/admin/login">Staff Login</Link>
          </div>
        </div>
      </div>
      <div className="nav">
        <Link className="brand" href="/">
          <img src={logoSrc} alt="Metas Adventist College" />
        </Link>
        <Navigation />
        <Link className="btn gold pill nav-cta" href="/admissions/apply">Apply Now</Link>
      </div>
    </header>
  );
}
