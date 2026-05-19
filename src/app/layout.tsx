import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { readCMSCollection, type SiteSettings } from '@/lib/cms-file';
import { collegeSchema } from '@/lib/schema';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { PageTransition } from '@/components/PageTransition';
import { ScrollAnimations } from '@/components/ScrollAnimations';

export const metadata: Metadata = {
  title: 'Metas Adventist College, Surat | Values-Based Higher Education',
  description: 'Values-based higher education for academic excellence, professional growth, service, and leadership in Athwalines, Surat.'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await readCMSCollection<SiteSettings>('site');
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PageTransition />
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <AnalyticsTracker />
        <ScrollAnimations />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collegeSchema(site)) }} />
      </body>
    </html>
  );
}
