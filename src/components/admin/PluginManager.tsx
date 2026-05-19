'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/admin/Icons';

type SettingSchema = { key: string; label: string; type: string; default?: string; placeholder?: string; options?: string[] };
type Plugin = {
  id: string; name: string; description: string; version: string; author: string;
  icon?: string; category: string; installed: boolean; enabled: boolean;
  settings: Record<string, string>; settingsSchema?: SettingSchema[];
  setupGuide?: string;
};

const CATEGORIES = ['all', 'analytics', 'communication', 'integration', 'utility'] as const;
const CAT_ICONS: Record<string, string> = { all: '🧩', analytics: '📊', communication: '💬', integration: '🔗', utility: '🛠️' };

export function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  async function load() {
    const res = await fetch('/api/admin/plugins');
    const data = await res.json();
    if (data.ok) setPlugins(data.plugins);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const filtered = useMemo(() => {
    let list = plugins;
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (search) { const q = search.toLowerCase(); list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)); }
    // Sort: recommended first, then installed, then alphabetical
    return list.sort((a, b) => {
      if ((a as any).recommended && !(b as any).recommended) return -1;
      if (!(a as any).recommended && (b as any).recommended) return 1;
      if (a.installed && !b.installed) return -1;
      if (!a.installed && b.installed) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [plugins, category, search]);

  const installedCount = plugins.filter((p) => p.installed).length;
  const activeCount = plugins.filter((p) => p.installed && p.enabled).length;

  async function action(pluginId: string, act: string, settings?: Record<string, string>) {
    const res = await fetch('/api/admin/plugins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: act, pluginId, settings }) });
    const data = await res.json();
    if (data.ok) showToast(data.message || (act === 'toggle' ? (data.enabled ? 'Enabled ✓' : 'Disabled') : 'Done ✓'));
    load();
  }

  async function handleUninstall(p: Plugin) {
    if (!confirm(`Uninstall "${p.name}"? This will remove it from your site.`)) return;
    action(p.id, 'uninstall');
  }

  if (loading) return <div className="plugin-loading"><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /></div>;

  return (
    <div>
      {toast && <div className="plugin-toast">{toast}</div>}

      <div className="plugin-stats">
        <span><strong>{plugins.length}</strong> available</span>
        <span><strong>{installedCount}</strong> installed</span>
        <span><strong>{activeCount}</strong> active</span>
      </div>

      <div className="plugin-toolbar">
        <div className="plugin-tabs">
          {CATEGORIES.map((cat) => (
            <button key={cat} className={`plugin-tab ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
              {CAT_ICONS[cat]} {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-wrap" style={{ flex: 'none', width: 220 }}>
          <input className="plugin-search" placeholder="Search plugins..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
      </div>

      <div className="plugin-grid">
        {filtered.map((p) => (
          <article key={p.id} className={`plugin-card ${p.installed ? (p.enabled ? 'active' : 'disabled') : ''}`}>
            <div className="plugin-header">
              <span className="plugin-icon">{p.icon || Icon.puzzle}</span>
              <div className="plugin-meta">
                <strong>{p.name} {(p as any).recommended && !p.installed && <span className="plugin-recommended">★ Recommended</span>}</strong>
                <small>v{p.version} • {p.author}</small>
              </div>
              <span className={`badge badge-${p.installed ? (p.enabled ? 'active' : 'draft') : 'new'}`}>
                {p.installed ? (p.enabled ? '● Active' : '○ Disabled') : 'Available'}
              </span>
            </div>

            <p className="plugin-desc">{p.description}</p>

            <div className="plugin-actions">
              {!p.installed && (
                <button className="btn gold" onClick={() => action(p.id, 'install')}>
                  {Icon.bolt} Install
                </button>
              )}
              {p.installed && (
                <>
                  <button className={`btn ${p.enabled ? 'outline' : 'gold'}`} onClick={() => action(p.id, 'toggle')}>
                    {p.enabled ? Icon.pause : Icon.play} {p.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn outline" onClick={() => setActiveId(activeId === p.id ? null : p.id)}>
                    {Icon.cog} {activeId === p.id ? 'Close' : 'Configure'}
                  </button>
                  <button className="btn danger" onClick={() => handleUninstall(p)}>{Icon.x}</button>
                </>
              )}
            </div>

            {activeId === p.id && p.installed && (
              <PluginSettings plugin={p} onSave={(s) => { action(p.id, 'settings', s); }} />
            )}
          </article>
        ))}
        {!filtered.length && (
          <div className="plugin-empty">
            <p>No plugins match your search.</p>
            <button className="btn outline" onClick={() => { setSearch(''); setCategory('all'); }}>Show all plugins</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PluginSettings({ plugin, onSave }: { plugin: Plugin; onSave: (s: Record<string, string>) => void }) {
  const [values, setValues] = useState<Record<string, string>>(plugin.settings);
  const [saved, setSaved] = useState(false);
  const schema = plugin.settingsSchema || [];
  const guide = plugin.setupGuide;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    onSave(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form className="plugin-settings" onSubmit={handleSave}>
      {guide && (
        <div className="plugin-guide">
          <strong>Setup Instructions</strong>
          {guide.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </div>
      )}

      {schema.length === 0 && <p className="plugin-no-settings">This plugin works out of the box — no configuration needed.</p>}

      {schema.map((s) => (
        <label key={s.key}>
          <span className="plugin-field-label">{s.label}</span>
          {s.type === 'textarea' ? (
            <textarea value={values[s.key] || s.default || ''} placeholder={s.placeholder} onChange={(e) => setValues({ ...values, [s.key]: e.target.value })} rows={3} />
          ) : s.type === 'select' ? (
            <select value={values[s.key] || s.default || ''} onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}>
              {s.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input value={values[s.key] || s.default || ''} placeholder={s.placeholder} onChange={(e) => setValues({ ...values, [s.key]: e.target.value })} />
          )}
        </label>
      ))}

      {schema.length > 0 && (
        <button className={`btn ${saved ? 'outline' : 'gold'}`} type="submit">
          {saved ? 'Saved!' : <>{Icon.save} Save Settings</>}
        </button>
      )}
    </form>
  );
}
