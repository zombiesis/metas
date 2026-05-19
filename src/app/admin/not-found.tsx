import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <section className="admin-login">
      <div className="admin-login-card" style={{ textAlign: 'center' }}>
        <span style={{ color: 'var(--gold)' }}><svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg></span>
        <h1 style={{ marginTop: 12 }}>Page not found</h1>
        <p>The admin page you're looking for doesn't exist or has been moved.</p>
        <div className="actions" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Link className="btn gold" href="/admin/dashboard">Go to Dashboard</Link>
          <Link className="btn outline" href="/admin/login">Back to Login</Link>
        </div>
      </div>
    </section>
  );
}
