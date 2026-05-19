'use client';

import { useEffect, useState } from 'react';

type Session = { id: string; ipAddress: string; userAgent: string; createdAt: string; lastActiveAt: string; expiresAt: string };

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/admin/sessions');
    const data = await res.json();
    if (data.ok) setSessions(data.sessions);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function revoke(sessionId: string) {
    await fetch('/api/admin/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
    setSessions((s) => s.filter((x) => x.id !== sessionId));
  }

  async function revokeAll() {
    await fetch('/api/admin/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    load();
  }

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>Loading sessions...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{sessions.length} active session{sessions.length !== 1 ? 's' : ''}</span>
        {sessions.length > 1 && <button className="btn outline" style={{ padding: '6px 12px', fontSize: '.78rem' }} onClick={revokeAll}>Revoke all others</button>}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {sessions.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: i === 0 ? 'rgba(184,134,11,0.06)' : 'var(--section-alt, #f8f9fb)', borderRadius: 10, border: '1px solid var(--border)', fontSize: '.82rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.ipAddress || 'Unknown IP'} {i === 0 && <span className="badge badge-active" style={{ marginLeft: 6 }}>current</span>}</div>
              <div style={{ color: 'var(--muted)', fontSize: '.76rem', marginTop: 2 }}>{(s.userAgent || '').slice(0, 60)}</div>
            </div>
            {i !== 0 && <button className="btn danger" style={{ padding: '5px 10px', fontSize: '.74rem' }} onClick={() => revoke(s.id)}>Revoke</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
