'use client';
import { useState, useRef, useEffect } from 'react';
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

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button className="menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
        <span style={mobileOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}} />
        <span style={mobileOpen ? { opacity: 0 } : {}} />
        <span style={mobileOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}} />
      </button>
      <div className={`nav-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      <nav aria-label="Primary navigation" className={mobileOpen ? 'open' : ''}>
        {NAV_ITEMS.map((item) => (
          <DropdownItem key={item.label} item={item} closeMobile={() => setMobileOpen(false)} />
        ))}
      </nav>
    </>
  );
}
