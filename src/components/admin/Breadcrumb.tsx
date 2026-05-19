'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const labels: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  homepage: 'Homepage',
  pages: 'Pages',
  programs: 'Programs',
  notices: 'Notices',
  documents: 'Documents',
  faculty: 'Faculty',
  media: 'Media',
  forms: 'Forms',
  admissions: 'Admissions',
  placements: 'Placements',
  alumni: 'Alumni',
  contacts: 'Contacts',
  events: 'Events',
  blogs: 'Blogs',
  careers: 'Careers',
  analytics: 'Analytics',
  security: 'Security',
  users: 'Users',
  roles: 'Roles',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  versions: 'Versions',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const label = labels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
        const isLast = i === segments.length - 1;
        return (
          <span key={href}>
            {i > 0 && <span className="breadcrumb-sep">/</span>}
            {isLast ? <span className="breadcrumb-current">{label}</span> : <Link href={href}>{label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}
