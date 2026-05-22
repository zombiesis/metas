'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Sticky bottom action bar that appears on mobile only after the user has
 * scrolled past the hero. Gives a prominent, always-reachable Apply Now CTA
 * which is the highest-value action for an admissions site.
 *
 * Hidden on /admin, /student, and /admissions/apply (already on the form).
 */
export function MobileStickyCTA() {
  const [show, setShow] = useState(false);
  const [hideOnPath, setHideOnPath] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (
      path.startsWith('/admin') ||
      path.startsWith('/student') ||
      path === '/admissions/apply'
    ) {
      setHideOnPath(true);
      return;
    }

    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (hideOnPath) return null;

  return (
    <div className={`mobile-sticky-cta${show ? ' visible' : ''}`} aria-hidden={!show}>
      <Link className="mobile-sticky-cta-btn" href="/admissions/apply">
        Apply Now →
      </Link>
      <a className="mobile-sticky-cta-call" href="tel:9512644385" aria-label="Call admissions">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
      </a>
    </div>
  );
}
