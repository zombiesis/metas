'use client';
import { useState } from 'react';

type Settings = { logo?: string; favicon?: string; primaryColor: string; accentColor: string; fontHeading: string; fontBody: string; tagline?: string; footerText?: string; customCss?: string };

export function BranchThemeEditor({ branchId, initial }: { branchId: string; initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function set(key: keyof Settings, value: string) { setS({ ...s, [key]: value }); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/branches', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: branchId, settings: s }) });
    const data = await res.json();
    setMsg(data.ok ? 'Saved!' : data.error || 'Failed');
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <form className="card" onSubmit={save}>
      <h3>Theme & Branding</h3>
      {msg && <p className="toast-inline">{msg}</p>}
      <div className="formgrid">
        <label>Primary Color <input type="color" value={s.primaryColor} onChange={e => set('primaryColor', e.target.value)} /></label>
        <label>Accent Color <input type="color" value={s.accentColor} onChange={e => set('accentColor', e.target.value)} /></label>
        <label>Heading Font <input value={s.fontHeading} onChange={e => set('fontHeading', e.target.value)} /></label>
        <label>Body Font <input value={s.fontBody} onChange={e => set('fontBody', e.target.value)} /></label>
        <label>Logo URL <input value={s.logo || ''} onChange={e => set('logo', e.target.value)} placeholder="/uploads/branch/logo.png" /></label>
        <label>Favicon URL <input value={s.favicon || ''} onChange={e => set('favicon', e.target.value)} placeholder="/uploads/branch/favicon.ico" /></label>
        <label>Tagline <input value={s.tagline || ''} onChange={e => set('tagline', e.target.value)} /></label>
        <label>Footer Text <input value={s.footerText || ''} onChange={e => set('footerText', e.target.value)} /></label>
      </div>
      <label>Custom CSS <textarea rows={4} value={s.customCss || ''} onChange={e => set('customCss', e.target.value)} placeholder=".header { background: ... }" /></label>
      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn gold" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Theme'}</button>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: s.primaryColor, border: '2px solid #ccc' }} />
        <div style={{ width: 32, height: 32, borderRadius: 6, background: s.accentColor, border: '2px solid #ccc' }} />
      </div>
    </form>
  );
}
