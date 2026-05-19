import type { SiteSettings } from '@/lib/cms-file';

export function collegeSchema(site: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: site.name,
    address: site.address,
    telephone: site.phones.registrar,
    email: site.emails.principal,
    url: 'https://suratcollege.metasofsda.in/'
  };
}
