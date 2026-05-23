'use client';

/**
 * FIX #12: Error boundary for /academics (courses) pages.
 * Shows a friendly message with retry button instead of crashing.
 */
export default function AcademicsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section" style={{ textAlign: 'center', padding: '80px 16px' }}>
      <div className="wrap">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Unable to load courses</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Please try again or return to the homepage.</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button className="btn gold" onClick={reset}>Retry</button>
          <a className="btn outline" href="/">Return Home</a>
        </div>
      </div>
    </section>
  );
}
