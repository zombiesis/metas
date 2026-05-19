'use client';

import { useState } from 'react';

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState<'idle' | 'setup' | 'done'>(enabled ? 'done' : 'idle');
  const [secret, setSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [token, setToken] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function startSetup() {
    const res = await fetch('/api/admin/2fa');
    const data = await res.json();
    if (data.ok) { setSecret(data.secret); setQrDataUrl(data.qrDataUrl); setStatus('setup'); setError(''); }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret, token }) });
    const data = await res.json();
    if (data.ok) { setCodes(data.recoveryCodes || []); setStatus('done'); }
    else setError(data.error || 'Failed');
  }

  async function disable() {
    if (!confirm('Disable two-factor authentication?')) return;
    const res = await fetch('/api/admin/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'disable' }) });
    const data = await res.json();
    if (data.ok) { setStatus('idle'); setCodes([]); setSecret(''); setQrDataUrl(''); }
  }

  if (status === 'idle') {
    return (
      <div>
        <p>Two-factor authentication is <strong>not enabled</strong>.</p>
        <button className="btn gold" onClick={startSetup}>Enable 2FA</button>
      </div>
    );
  }

  if (status === 'setup') {
    return (
      <div>
        <p>Scan this QR code with your authenticator app:</p>
        {qrDataUrl && <img src={qrDataUrl} alt="2FA QR Code" width={256} height={256} style={{ margin: '12px 0', borderRadius: 8 }} />}
        <p style={{ fontSize: '0.8rem' }}>Manual key: <code>{secret}</code></p>
        <form onSubmit={confirmSetup} className="form" style={{ marginTop: 12 }}>
          <label>Verification code<input value={token} onChange={(e) => setToken(e.target.value)} inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus /></label>
          {error && <p className="admin-error">{error}</p>}
          <button className="btn gold">Confirm &amp; Enable</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <p>Two-factor authentication is <strong>enabled</strong> ✓</p>
      {codes.length > 0 && (
        <div style={{ margin: '12px 0', padding: 12, background: 'var(--surface-alt, #f5f5f5)', borderRadius: 6 }}>
          <p><strong>Recovery codes</strong> — save these somewhere safe. Each can only be used once.</p>
          <ul style={{ fontFamily: 'monospace', columns: 2 }}>{codes.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      <button className="btn outline" onClick={disable} style={{ marginTop: 8 }}>Disable 2FA</button>
    </div>
  );
}
