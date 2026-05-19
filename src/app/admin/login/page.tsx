import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  '1': 'Invalid username or password.',
  'locked': 'Account is temporarily locked due to too many failed attempts. Try again later.',
  '2fa_expired': 'Two-factor verification expired. Please sign in again.',
  '2fa_locked': 'Account locked after too many failed 2FA attempts. Try again in 30 minutes.',
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminLogin({ searchParams }: Props) {
  const session = await getAdminSession();
  if (session) redirect('/admin/dashboard');
  const params = await searchParams;
  const errorMsg = params.error ? ERROR_MESSAGES[params.error] || 'Authentication failed.' : null;
  return (
    <section className="admin-login">
      <div className="admin-login-card">
        <div className="login-brand">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="#b8860b" strokeWidth="2.5" fill="none"/><path d="M24 4v40M6 14l18 10 18-10" stroke="#b8860b" strokeWidth="2" fill="none" opacity="0.5"/><circle cx="24" cy="20" r="5" fill="#b8860b" opacity="0.8"/></svg>
          <div>
            <strong>Metas Adventist College</strong>
            <span>Surat, Gujarat • Seventh-day Adventist Organization</span>
          </div>
        </div>
        <p className="eyebrow">Enterprise Content Management</p>
        <h1>Admin Sign In</h1>
        <p>Access the CMS to manage content, admissions, analytics, and security for the college website.</p>
        {errorMsg && <p className="admin-error" role="alert">{errorMsg}</p>}
        <form method="post" action="/api/admin/login" className="form">
          <label>Username<input name="username" autoComplete="username" required autoFocus /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
          <button className="btn gold">Sign in</button>
        </form>
        <p className="required">Run <code>npm run db:push</code> and <code>npm run db:seed</code> before first login.</p>
      </div>
    </section>
  );
}
