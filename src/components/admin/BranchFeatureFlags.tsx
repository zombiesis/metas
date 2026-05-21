'use client';
import { useState } from 'react';

const AVAILABLE_FEATURES = [
  { key: 'careers', label: 'Careers / Job Openings' },
  { key: 'placements', label: 'Placements' },
  { key: 'alumni', label: 'Alumni Section' },
  { key: 'blogs', label: 'Blog / News' },
  { key: 'events', label: 'Events Calendar' },
  { key: 'recruiters', label: 'Recruiter Portal' },
  { key: 'admissions_form', label: 'Online Admission Form' },
  { key: 'newsletter', label: 'Newsletter Signup' },
];

export function BranchFeatureFlags({ branchId, initial }: { branchId: string; initial: Record<string, boolean> }) {
  const [flags, setFlags] = useState<Record<string, boolean>>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function toggle(key: string) { setFlags({ ...flags, [key]: !flags[key] }); }

  async function save() {
    setSaving(true);
    const res = await fetch('/api/admin/branches', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: branchId, settings: { features: JSON.stringify(flags) } }) });
    const data = await res.json();
    setMsg(data.ok ? 'Saved!' : data.error || 'Failed');
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="card">
      <h3>Feature Flags</h3>
      <p style={{ opacity: 0.7, marginBottom: 12 }}>Enable or disable sections for this branch.</p>
      {msg && <p className="toast-inline">{msg}</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {AVAILABLE_FEATURES.map(f => (
          <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={flags[f.key] !== false} onChange={() => toggle(f.key)} />
            {f.label}
          </label>
        ))}
      </div>
      <button className="btn gold" onClick={save} disabled={saving} style={{ marginTop: 16 }}>{saving ? 'Saving...' : 'Save Flags'}</button>
    </div>
  );
}
