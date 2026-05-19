export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ error?: string }> };

export default async function Verify2FA({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <section className="admin-login">
      <div className="admin-login-card">
        <p className="eyebrow">Two-Factor Authentication</p>
        <h1>Enter verification code</h1>
        <p>Open your authenticator app and enter the 6-digit code.</p>
        {params.error ? <p className="admin-error">Invalid code. Please try again.</p> : null}
        <form method="post" action="/api/admin/verify-2fa" className="form">
          <label>Code<input name="token" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required autoFocus /></label>
          <button className="btn gold">Verify</button>
        </form>
        <p className="required">This code expires in 5 minutes. If it expires, you will need to sign in again.</p>
      </div>
    </section>
  );
}
