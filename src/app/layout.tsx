import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { readCMSCollection, type SiteSettings } from '@/lib/cms-file';
import { collegeSchema } from '@/lib/schema';
import { getBranchTheme, themeToCssVars, sanitizeCustomCss } from '@/lib/theme';
import { getCurrentBranchId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { PageTransition } from '@/components/PageTransition';
import { ScrollAnimations } from '@/components/ScrollAnimations';
import { CookieConsent } from '@/components/CookieConsent';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { AntiTamper } from '@/components/AntiTamper';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const branchId = await getCurrentBranchId();
  let branchName = 'Metas Adventist College';
  let tagline = 'Values-Based Higher Education';
  if (branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId }, include: { settings: true } }).catch(() => null);
    if (branch) { branchName = branch.name; tagline = branch.settings?.tagline || tagline; }
  }
  return {
    title: { default: `${branchName}, Surat | ${tagline}`, template: `%s | ${branchName}` },
    description: `${tagline} — academic excellence, professional growth, service, and leadership in Athwalines, Surat.`,
    openGraph: { type: 'website', siteName: branchName, title: `${branchName} | ${tagline}`, description: `${tagline} — academic excellence, professional growth, service, and leadership.` },
    twitter: { card: 'summary_large_image', title: branchName, description: tagline },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, theme] = await Promise.all([
    readCMSCollection<SiteSettings>('site'),
    getBranchTheme(),
  ]);
  return (
    <html lang="en-IN" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {theme.favicon && <link rel="icon" href={theme.favicon} />}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={theme.primaryColor} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style dangerouslySetInnerHTML={{ __html: `:root { ${themeToCssVars(theme)} }${sanitizeCustomCss(theme.customCss || '')}` }} />
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
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}` }} />
        <CookieConsent />
        <ChatbotWidget />
        <AntiTamper />
      </body>
    </html>
  );
}
