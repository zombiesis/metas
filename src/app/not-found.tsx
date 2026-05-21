import Link from 'next/link';
import { getBranchTheme } from '@/lib/theme';

export default async function NotFound() {
  const theme = await getBranchTheme();
  return (
    <section className="not-found">
      <div>
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>{theme.tagline ? `${theme.tagline} — ` : ''}The page you&apos;re looking for may have moved or doesn&apos;t exist.</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <Link className="btn gold" href="/">Return Home →</Link>
          <Link className="btn outline" href="/contact">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}
