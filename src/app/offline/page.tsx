'use client';

export default function OfflinePage() {
  return (
    <section className="not-found">
      <div>
        <h1>You&apos;re Offline</h1>
        <p>Please check your internet connection and try again.</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button className="btn gold" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    </section>
  );
}
