'use client';
import { useState } from 'react';
import Link from 'next/link';

type Domain = { id: string; domain: string; isPrimary: boolean };
type Settings = { cfPlan?: string; logo?: string | null; primaryColor?: string; accentColor?: string };
type Branch = {
  id: string;
  name: string;
  slug: string;
  status: string;
  domains: Domain[];
  settings: Settings | null;
  _count: { users: number };
};

const CF_PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' },
];

export function BranchManager({ initial }: { initial: Branch[] }) {
  const [branches, setBranches] = useState<Branch[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [domainEditing, setDomainEditing] = useState<Branch | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  }

  async function refreshBranches() {
    const res = await fetch('/api/admin/branches');
    const data = await res.json();
    if (data.ok) setBranches(data.branches);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, domain: domain || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshBranches();
        setShowForm(false);
        setName('');
        setSlug('');
        setDomain('');
        flash('Branch created — add domains and customize theme below.');
      } else {
        flash(data.error || 'Failed');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, name, slug }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshBranches();
        setEditing(null);
        flash('Branch updated.');
      } else {
        flash(data.error || 'Failed');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(b: Branch) {
    if (!confirm(`Delete branch "${b.name}"?\nThis is blocked if the branch has any pages or users with content.`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshBranches();
        flash('Branch deleted.');
      } else {
        flash(data.error || 'Failed');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusToggle(b: Branch) {
    const next = b.status === 'active' ? 'inactive' : 'active';
    setBusy(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, status: next }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshBranches();
        flash(`Branch ${next === 'active' ? 'activated' : 'deactivated'}.`);
      } else {
        flash(data.error || 'Failed');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDomains(domains: Domain[]) {
    if (!domainEditing) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: domainEditing.id,
          domains: domains.map((d) => ({ domain: d.domain, isPrimary: d.isPrimary })),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshBranches();
        setDomainEditing(null);
        flash('Domains saved. DNS must point to this server for traffic to route.');
      } else {
        flash(data.error || 'Failed');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCfPlan(b: Branch, cfPlan: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, settings: { cfPlan } }),
      });
      const data = await res.json();
      if (data.ok) {
        await refreshBranches();
        flash(`Cloudflare plan set to ${cfPlan}.`);
      } else {
        flash(data.error || 'Failed');
      }
    } finally {
      setBusy(false);
    }
  }

  function startEdit(b: Branch) {
    setEditing(b);
    setName(b.name);
    setSlug(b.slug);
    setShowForm(false);
  }

  return (
    <div>
      {msg && <div className="toast-inline" role="status">{msg}</div>}

      <details className="card" style={{ marginBottom: 16, background: '#fafaf7' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
          📘 How branch websites work (click to expand)
        </summary>
        <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
          <p>Each branch is a fully independent website with its own domain, content, theme, and users.</p>
          <ol style={{ marginLeft: 20 }}>
            <li><strong>Create branch</strong> — give it a name + slug. (e.g., &quot;Bangalore Campus&quot; / &quot;bangalore&quot;)</li>
            <li><strong>Add domain(s)</strong> — e.g. <code>bangalore.metasadventist.edu</code>. Each domain is unique to one branch.</li>
            <li><strong>Point DNS</strong> — update your DNS provider so the domain resolves to this server&apos;s IP / Cloudflare proxy.</li>
            <li><strong>Customize theme</strong> — logo, colors, fonts, footer text per branch.</li>
            <li><strong>Pick Cloudflare plan</strong> — Free for small branches, Enterprise for the main campus.</li>
            <li><strong>Activate</strong> — once DNS resolves, the branch&apos;s website is live at its domain.</li>
          </ol>
          <p style={{ marginTop: 8 }}>
            <strong>Local testing:</strong> add the domain to your <code>hosts</code> file pointing to <code>127.0.0.1</code>, then visit it in your browser. The CMS will serve that branch&apos;s content.
          </p>
        </div>
      </details>

      <div className="admin-toolbar">
        <h2 style={{ margin: 0 }}>Branches ({branches.length})</h2>
        <button
          className="btn gold"
          onClick={() => {
            setShowForm(!showForm);
            setEditing(null);
            setName('');
            setSlug('');
            setDomain('');
          }}
        >
          {showForm ? 'Cancel' : '+ New Branch'}
        </button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate} style={{ marginBottom: 24 }}>
          <h3>Create Branch</h3>
          <div className="formgrid">
            <label>
              Name
              <input
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                placeholder="Bangalore Campus"
              />
            </label>
            <label>
              Slug
              <input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="bangalore"
              />
            </label>
            <label>
              First domain (optional)
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="bangalore.metasadventist.edu"
              />
            </label>
          </div>
          <p className="muted small">You can add more domains and customize theme after creation.</p>
          <button className="btn gold" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create Branch'}
          </button>
        </form>
      )}

      {editing && (
        <form className="card" onSubmit={handleUpdate} style={{ marginBottom: 24 }}>
          <h3>Edit: {editing.name}</h3>
          <div className="formgrid">
            <label>Name <input required value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Slug <input required value={slug} onChange={(e) => setSlug(e.target.value)} /></label>
          </div>
          <button className="btn gold" type="submit" disabled={busy}>Save</button>
          <button className="btn outline" type="button" onClick={() => setEditing(null)}>Cancel</button>
        </form>
      )}

      {domainEditing && (
        <DomainEditor
          branch={domainEditing}
          onSave={handleSaveDomains}
          onCancel={() => setDomainEditing(null)}
          busy={busy}
        />
      )}

      <div className="grid two">
        {branches.map((b) => {
          const primary = b.domains?.find((d) => d.isPrimary) || b.domains?.[0];
          const liveUrl = primary ? `https://${primary.domain}` : null;
          const cfPlan = b.settings?.cfPlan || 'free';
          return (
            <article className="card" key={b.id}>
              <div className="card-header">
                <h3 style={{ margin: 0 }}>{b.name}</h3>
                <span className={`badge ${b.status === 'active' ? 'green' : 'gray'}`}>{b.status}</span>
              </div>

              <p style={{ marginBottom: 4 }}>
                <strong>Slug:</strong> <code>{b.slug}</code>
              </p>
              <p style={{ marginBottom: 4 }}>
                <strong>Users:</strong> {b._count?.users || 0}
              </p>
              <p style={{ marginBottom: 4 }}>
                <strong>Domains:</strong>{' '}
                {b.domains?.length
                  ? b.domains.map((d) => (
                      <span key={d.id} style={{ marginRight: 6 }}>
                        <code>{d.domain}</code>{d.isPrimary && ' ⭐'}
                      </span>
                    ))
                  : <em className="muted">None — add a domain to make this branch reachable</em>}
              </p>
              <p style={{ marginBottom: 8 }}>
                <strong>Cloudflare plan:</strong>{' '}
                <select
                  value={cfPlan}
                  onChange={(e) => handleCfPlan(b, e.target.value)}
                  disabled={busy}
                  style={{ padding: '2px 6px' }}
                >
                  {CF_PLANS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </p>

              {liveUrl && (
                <p style={{ marginBottom: 8 }}>
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="btn outline" style={{ display: 'inline-block' }}>
                    🌐 Open live site →
                  </a>
                </p>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn outline" onClick={() => setDomainEditing(b)} disabled={busy}>
                  Manage domains
                </button>
                <Link href={`/admin/branches/${b.id}/theme`} className="btn outline">
                  Theme &amp; branding
                </Link>
                <button className="btn outline" onClick={() => startEdit(b)} disabled={busy}>
                  Rename
                </button>
                <button className="btn outline" onClick={() => handleStatusToggle(b)} disabled={busy}>
                  {b.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="btn outline"
                  style={{ color: '#a33' }}
                  onClick={() => handleDelete(b)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DomainEditor({
  branch,
  onSave,
  onCancel,
  busy,
}: {
  branch: Branch;
  onSave: (domains: Domain[]) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [domains, setDomains] = useState<Domain[]>(branch.domains || []);
  const [newDomain, setNewDomain] = useState('');

  function addDomain() {
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(trimmed)) {
      alert('Enter a valid domain like branch.example.com');
      return;
    }
    if (domains.some((d) => d.domain === trimmed)) {
      alert('Domain already added');
      return;
    }
    const isFirst = domains.length === 0;
    setDomains([...domains, { id: `tmp-${Date.now()}`, domain: trimmed, isPrimary: isFirst }]);
    setNewDomain('');
  }

  function removeDomain(id: string) {
    setDomains(domains.filter((d) => d.id !== id));
  }

  function setPrimary(id: string) {
    setDomains(domains.map((d) => ({ ...d, isPrimary: d.id === id })));
  }

  return (
    <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #C7A45B' }}>
      <h3>Domains for: {branch.name}</h3>
      <p className="muted small">
        Each domain must be unique across all branches. Once saved, point your DNS provider at this server&apos;s IP (or your Cloudflare proxy) for the domain to start routing here.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="newbranch.metasadventist.edu"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDomain();
            }
          }}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn gold" onClick={addDomain} disabled={busy}>
          + Add
        </button>
      </div>

      {domains.length === 0 ? (
        <p className="muted">No domains yet. Add one above.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {domains.map((d) => (
            <li
              key={d.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <code style={{ flex: 1 }}>{d.domain}</code>
              {d.isPrimary ? (
                <span className="badge green">Primary ⭐</span>
              ) : (
                <button type="button" className="btn outline" onClick={() => setPrimary(d.id)}>
                  Make primary
                </button>
              )}
              <button
                type="button"
                className="btn outline"
                style={{ color: '#a33' }}
                onClick={() => removeDomain(d.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button className="btn gold" onClick={() => onSave(domains)} disabled={busy}>
          {busy ? 'Saving…' : 'Save domains'}
        </button>
        <button className="btn outline" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
