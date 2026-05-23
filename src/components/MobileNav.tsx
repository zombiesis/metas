'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about', children: [
    { label: 'Institute Details', href: '/about' },
    { label: "Director's Message", href: '/about/directors-message' },
    { label: 'Education Policy', href: '/about/education-policy' },
    { label: 'Affiliations & Accreditation', href: '/iqac-accreditation' },
    { label: 'Governing Body', href: '/about/governing-body' },
    { label: 'Organogram', href: '/about/organogram' },
    { label: 'Legal & Compliance', href: '/about/legal-compliance' },
  ]},
  { label: 'Programs', href: '/academics', children: [
    { label: 'BBA', href: '/academics/bba' },
    { label: 'MBA', href: '/academics/mba' },
    { label: 'GNM', href: '/academics/gnm' },
    { label: 'Value Added Courses', href: '/academics/value-added' },
  ]},
  { label: 'Faculty', href: '/faculty' },
  { label: 'Student Corner', href: '/student-corner', children: [
    { label: 'Student Corner', href: '/student-corner' },
    { label: 'Placements', href: '/placements' },
    { label: 'Alumni', href: '/alumni' },
  ]},
  { label: 'Admissions', href: '/admissions', children: [
    { label: 'Apply Online', href: '/admissions/apply' },
    { label: 'Cancellation Policy', href: '/admissions/cancellation-policy' },
  ]},
  { label: 'Infrastructure', href: '/infrastructure' },
  { label: 'R & D', href: '/research', children: [
    { label: 'About R & D', href: '/research' },
    { label: 'R & D Data', href: '/research/data' },
  ]},
  { label: 'Media', href: '/media', children: [
    { label: 'Photo Gallery', href: '/media/gallery' },
    { label: 'Videos', href: '/media/videos' },
    { label: 'Events', href: '/media/events' },
  ]},
  { label: 'Career', href: '/careers/current-openings', children: [
    { label: 'HR Department', href: '/careers/hr' },
    { label: 'Current Openings', href: '/careers/current-openings' },
  ]},
  { label: 'Contact', href: '/contact' },
];

/* FIX #1: Dropdown item with accordion behavior on mobile */
function DropdownItem({ item, closeMobile }: { item: NavItem; closeMobile: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!item.children) {
    return <Link href={item.href} className="nav-link" onClick={closeMobile}>{item.label}</Link>;
  }

  return (
    <div className="nav-dropdown" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="nav-link has-dropdown" onClick={() => setOpen(!open)} aria-expanded={open}>
        {item.label} <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      {open && (
        <div className="dropdown-menu">
          {item.children.map((child) => (
            <Link key={child.href} href={child.href} onClick={() => { setOpen(false); closeMobile(); }}>{child.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * FIX #1: Full mobile navigation with:
 * - 48x48 hamburger button
 * - GPU-accelerated slide-in drawer (translateX)
 * - Focus trap when open
 * - Close on Escape, overlay click, swipe left
 * - Body scroll lock
 */
export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Body scroll lock — prevent page jump by preserving scroll position
  useEffect(() => {
    if (mobileOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [mobileOpen]);

  // Escape key close
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  // Focus trap
  useEffect(() => {
    if (!mobileOpen || !navRef.current) return;
    const nav = navRef.current;
    const focusable = nav.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    nav.addEventListener('keydown', trap);
    return () => nav.removeEventListener('keydown', trap);
  }, [mobileOpen]);

  // Swipe left to close
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (diff > 60) setMobileOpen(false); // swipe right (drawer is on right, so swipe right = close? Actually swipe left closes right drawer)
  }, []);

  return (
    <>
      {/* FIX #1: Hamburger button — 48x48 touch target */}
      <button
        className="menu-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        <span style={mobileOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
        <span style={mobileOpen ? { opacity: 0 } : {}} />
        <span style={mobileOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
      </button>

      {/* Overlay */}
      <div
        className={`nav-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer nav */}
      <nav
        ref={navRef}
        aria-label="Primary navigation"
        className={mobileOpen ? 'open' : ''}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {NAV_ITEMS.map((item) => (
          <DropdownItem key={item.label} item={item} closeMobile={() => setMobileOpen(false)} />
        ))}
      </nav>
    </>
  );
}
