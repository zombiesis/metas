'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="not-found">
      <div>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Our team has been notified.</p>
        {error.digest && <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Reference: {error.digest}</p>}
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button className="btn gold" onClick={reset}>Try Again</button>
          <a className="btn outline" href="/">Return Home</a>
        </div>
      </div>
    </section>
  );
}
