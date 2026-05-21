'use client';
import { useEffect, useState } from 'react';

type ApiKey = { id: string; name: string; prefix: string; scopes: string; expiresAt?: string; lastUsedAt?: string; createdAt: string };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState('read');
  const [newKey, setNewKey] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { fetch('/api/admin/api-keys').then(r => r.json()).then(d => { if (d.ok) setKeys(d.keys); }); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, scopes }) });
    const d = await res.json();
    if (d.ok) { setNewKey(d.key); setName(''); setKeys([...keys, { id: '', name, prefix: d.prefix, scopes, createdAt: new Date().toISOString() }]); }
    else setMsg(d.error);
  }

  async function revoke(id: string) {
    await fetch('/api/admin/api-keys', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setKeys(keys.filter(k => k.id !== id));
  }

  return (
    <div>
      <h2>API Keys</h2>
      {newKey && <div className="card" style={{ background: '#f0fdf4', border: '1px solid #10b981' }}><p><strong>New key created — copy it now (won't be shown again):</strong></p><code style={{ wordBreak: 'break-all' }}>{newKey}</code></div>}
      {msg && <p className="toast-inline">{msg}</p>}
      <form className="card" onSubmit={create} style={{ marginBottom: 16 }}>
        <div className="formgrid">
          <label>Name <input required value={name} onChange={e => setName(e.target.value)} placeholder="My integration" /></label>
          <label>Scopes <select value={scopes} onChange={e => setScopes(e.target.value)}><option value="read">Read only</option><option value="read,write">Read + Write</option></select></label>
        </div>
        <button className="btn gold" type="submit">Create Key</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th>Name</th><th>Prefix</th><th>Scopes</th><th>Last Used</th><th></th></tr></thead>
        <tbody>
          {keys.map(k => (
            <tr key={k.id || k.prefix} style={{ borderBottom: '1px solid #eee' }}>
              <td>{k.name}</td><td><code>{k.prefix}...</code></td><td>{k.scopes}</td>
              <td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</td>
              <td>{k.id && <button className="btn outline" onClick={() => revoke(k.id)}>Revoke</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!keys.length && <p className="empty-hint">No API keys. Create one to enable external integrations.</p>}
    </div>
  );
}
