'use client';

import { useState } from 'react';

export function PasswordChangeForm() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMessage('');
    if (newPw !== confirm) { setError('Passwords do not match.'); return; }
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw })
    });
    const data = await res.json();
    if (data.ok) { setMessage('Password changed. Other sessions have been revoked.'); setCurrent(''); setNewPw(''); setConfirm(''); }
    else setError(data.error || 'Failed to change password.');
  }

  return (
    <form onSubmit={handleSubmit} className="form" style={{ display: 'grid', gap: 14 }}>
      <label>Current password<input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required /></label>
      <label>New password<input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" required minLength={12} /></label>
      <label>Confirm new password<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></label>
      <small>Min 12 characters, uppercase, lowercase, number, and special character required.</small>
      {error && <p className="admin-error">{error}</p>}
      {message && <p style={{ color: '#166534', fontWeight: 600 }}>{message}</p>}
      <button className="btn gold" type="submit">Change Password</button>
    </form>
  );
}
