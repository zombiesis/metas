'use client';
import { useState } from 'react';

type Branch = { id: string; name: string; slug: string; status: string; domains: { id: string; domain: string; isPrimary: boolean }[]; _count: { users: number } };

export function BranchManager({ initial }: { initial: Branch[] }) {
  const [branches, setBranches] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [msg, setMsg] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, domain: domain || undefined }) });
    const data = await res.json();
    if (data.ok) { setBranches([...branches, { ...data.branch, _count: { users: 1 } }]); setShowForm(false); setName(''); setSlug(''); setDomain(''); setMsg('Branch created'); }
    else setMsg(data.error || 'Failed');
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const res = await fetch('/api/admin/branches', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, name, slug }) });
    const data = await res.json();
    if (data.ok) { setBranches(branches.map(b => b.id === editing.id ? { ...b, name, slug } : b)); setEditing(null); setMsg('Updated'); }
    else setMsg(data.error || 'Failed');
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this branch? All its content will be orphaned.')) return;
    const res = await fetch('/api/admin/branches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (data.ok) { setBranches(branches.filter(b => b.id !== id)); setMsg('Deleted'); }
    else setMsg(data.error || 'Failed');
    setTimeout(() => setMsg(''), 3000);
  }

  function startEdit(b: Branch) { setEditing(b); setName(b.name); setSlug(b.slug); setShowForm(false); }

  return (
    <div>
      {msg && <p className="toast-inline">{msg}</p>}

      <div className="admin-toolbar">
        <h2>Branches ({branches.length})</h2>
        <button className="btn gold" onClick={() => { setShowForm(!showForm); setEditing(null); setName(''); setSlug(''); setDomain(''); }}>+ New Branch</button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate} style={{ marginBottom: 24 }}>
          <h3>Create Branch</h3>
          <div className="formgrid">
            <label>Name <input required value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} /></label>
            <label>Slug <input required value={slug} onChange={e => setSlug(e.target.value)} /></label>
            <label>Domain (optional) <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="branch.example.com" /></label>
          </div>
          <button className="btn gold" type="submit">Create</button>
          <button className="btn outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      {editing && (
        <form className="card" onSubmit={handleUpdate} style={{ marginBottom: 24 }}>
          <h3>Edit: {editing.name}</h3>
          <div className="formgrid">
            <label>Name <input required value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Slug <input required value={slug} onChange={e => setSlug(e.target.value)} /></label>
          </div>
          <button className="btn gold" type="submit">Save</button>
          <button className="btn outline" type="button" onClick={() => setEditing(null)}>Cancel</button>
        </form>
      )}

      <div className="grid two">
        {branches.map(b => (
          <article className="card" key={b.id}>
            <div className="card-header"><h3>{b.name}</h3><span className={`badge ${b.status === 'active' ? 'green' : 'gray'}`}>{b.status}</span></div>
            <p><strong>Slug:</strong> {b.slug}</p>
            <p><strong>Domains:</strong> {b.domains?.map(d => d.domain).join(', ') || 'None'}</p>
            <p><strong>Users:</strong> {b._count?.users || 0}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn outline" onClick={() => startEdit(b)}>Edit</button>
              <button className="btn outline" onClick={() => handleDelete(b.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
