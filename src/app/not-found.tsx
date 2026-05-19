import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="not-found">
      <div>
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>The page you&apos;re looking for may have moved during our sitemap migration or doesn&apos;t exist.</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <Link className="btn gold" href="/">Return Home →</Link>
          <Link className="btn outline" href="/contact">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}
