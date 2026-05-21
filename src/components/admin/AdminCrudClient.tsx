'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { AdminCollectionConfig, AdminField } from '@/lib/admin-fields';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { RowContextMenu } from '@/components/admin/RowContextMenu';
import { ConfirmDialog, useConfirm } from '@/components/admin/ConfirmDialog';
import { LivePreview } from '@/components/admin/LivePreview';
import { useT } from '@/lib/useT';

type RecordMap = Record<string, any>;

function StatusBadge({ value }: { value: any }) {
  const text = String(value || '').toLowerCase();
  if (!text) return null;
  const cls = text === 'published' || text === 'active' || text === 'info' ? 'badge-active'
    : text === 'draft' || text === 'warning' ? 'badge-draft'
    : text === 'new' ? 'badge-new'
    : text === 'archived' || text === 'expired' || text === 'inactive' || text === 'critical' || text === 'suspended' ? 'badge-archived'
    : '';
  return <span className={`badge ${cls}`}>{text}</span>;
}

function emptyRecord(fields: AdminField[]) {
  const base: RecordMap = {};
  for (const field of fields) {
    if (field.type === 'checkbox') base[field.name] = false;
    else if (field.type === 'list') base[field.name] = [];
    else base[field.name] = '';
  }
  return base;
}

function displayValue(value: any) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function normalize(records: any[]) {
  return records.map((record) => {
    const copy = { ...record };
    if (record.role?.name) copy.roleName = record.role.name;
    if (record.permissions) copy.permissionKeys = record.permissions.map((p: any) => p.permission?.key || p.key).filter(Boolean);
    delete copy.passwordHash;
    return copy;
  });
}

function valueForInput(record: RecordMap, field: AdminField) {
  const value = record[field.name];
  if (field.type === 'date' && value) return String(value).slice(0, 10);
  if (field.type === 'list') return Array.isArray(value) ? value.join('\n') : displayValue(value).split(',').map((v) => v.trim()).filter(Boolean).join('\n');
  return displayValue(value);
}

function FormField({ field, record, onChange, error }: { field: AdminField; record: RecordMap; onChange: (name: string, value: any) => void; error?: string }) {
  const value = valueForInput(record, field);
  const type = field.type || 'text';
  if (type === 'readonly') {
    return (
      <label>{field.label}
        <span className="copy-field">
          <input value={value} readOnly />
          {value && <button type="button" className="copy-btn" onClick={() => { navigator.clipboard.writeText(value); }} title="Copy"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75m10.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/></svg></button>}
        </span>
      </label>
    );
  }
  if (type === 'checkbox') {
    return <label className="admin-check"><input type="checkbox" checked={Boolean(record[field.name])} onChange={(event) => onChange(field.name, event.target.checked)} /> {field.label}</label>;
  }
  if (type === 'select') {
    return <label>{field.label}<select value={value} required={field.required} onChange={(event) => onChange(field.name, event.target.value)}><option value="">Select</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>{field.help ? <small>{field.help}</small> : null}</label>;
  }
  if (type === 'textarea' || type === 'list') {
    return <label>{field.label}<textarea value={value} required={field.required} placeholder={field.placeholder} onChange={(event) => onChange(field.name, type === 'list' ? event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) : event.target.value)} />{field.help ? <small>{field.help}</small> : null}</label>;
  }
  if (type === 'richtext') {
    return <label>{field.label}<RichTextEditor label={field.label} value={value} onChange={(html) => onChange(field.name, html)} />{field.help ? <small>{field.help}</small> : null}</label>;
  }
  const isImageField = /image|photo|avatar|logo|thumbnail/i.test(field.name);
  const looksLikeImage = isImageField && value && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(value);
  const maxLen = /seoTitle|seoDescription|summary/.test(field.name) ? (field.name === 'seoTitle' ? 70 : field.name === 'seoDescription' ? 160 : 500) : 0;
  return (
    <label>
      {field.label}
      <input type={type} value={value} required={field.required} placeholder={field.placeholder} maxLength={maxLen || undefined} onChange={(event) => onChange(field.name, event.target.value)} />
      {maxLen > 0 && <span className={`char-count ${String(value).length > maxLen ? 'over' : ''}`}>{String(value).length}/{maxLen}</span>}
      {looksLikeImage && <img className="field-preview" src={value} alt="Preview" />}
      {field.help ? <small>{field.help}</small> : null}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function FormTabsView({ fields, draft, onChange, errors }: { fields: AdminField[]; draft: RecordMap; onChange: (n: string, v: any) => void; errors: Record<string, string> }) {
  const [tab, setTab] = useState('content');
  const seo = fields.filter((f) => /seo|meta/i.test(f.name));
  const settings = fields.filter((f) => /status|publish|visibility|pinned|spotlight|contactVisible/i.test(f.name));
  const content = fields.filter((f) => !seo.includes(f) && !settings.includes(f));
  const tabs = [
    { id: 'content', label: 'Content', fields: content },
    ...(seo.length ? [{ id: 'seo', label: 'SEO', fields: seo }] : []),
    ...(settings.length ? [{ id: 'settings', label: 'Settings', fields: settings }] : []),
  ];
  const active = tabs.find((t) => t.id === tab) || tabs[0];
  return (
    <div>
      <div className="form-tabs-nav" role="tablist">
        {tabs.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={`form-tab ${tab === t.id ? 'active' : ''}`} type="button" onClick={() => setTab(t.id)}>{t.label} <small>({t.fields.length})</small></button>)}
      </div>
      <div className="form-tabs-content">
        {active.fields.map((field) => <FormField key={field.name} field={field} record={draft} onChange={onChange} error={errors[field.name]} />)}
      </div>
    </div>
  );
}

export function AdminCrudClient({ config, initialRecords }: { config: AdminCollectionConfig; initialRecords: any[] }) {
  const t = useT();
  const [records, setRecords] = useState<RecordMap[]>(normalize(initialRecords || []));
  const [selectedId, setSelectedId] = useState<string | 'new'>(records[0]?.id || 'new');
  const [draft, setDraft] = useState<RecordMap>(records[0] || emptyRecord(config.fields));
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; record: RecordMap } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Warn on unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newRecord(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { searchRef.current?.blur(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(q));
  }, [records, debouncedQuery]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortField] || '').toLowerCase();
      const bv = String(b[sortField] || '').toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  function select(record: RecordMap) {
    setSelectedId(record.id || 'new');
    setDraft({ ...record });
    setMessage('');
    setDirty(false);
  }

  function newRecord() {
    setSelectedId('new');
    setDraft(emptyRecord(config.fields));
    setMessage('Creating a new record. Fill the fields and save.');
  }

  function update(name: string, value: any) {
    setDraft((current) => ({ ...current, [name]: value }));
    setDirty(true);
  }

  async function save(statusOverride?: string) {
    startTransition(async () => {
      setMessage('Saving...');
      const payload = { ...draft };
      if (statusOverride) payload.status = statusOverride;
      const method = selectedId === 'new' ? 'POST' : 'PUT';
      const response = await fetch(`/api/admin/cms/${config.collection}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId === 'new' ? undefined : selectedId, data: payload })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.error || 'Save failed.');
        if (result.fields) setFieldErrors(result.fields);
        return;
      }
      setFieldErrors({});
      const saved = result.record;
      setRecords((current) => selectedId === 'new' ? [saved, ...current] : current.map((item) => item.id === selectedId ? saved : item));
      setSelectedId(saved.id);
      setDraft(saved);
      setMessage('Saved successfully.');
      setDirty(false);
      setTimeout(() => setMessage(''), 4000);
    });
  }

  const confirm = useConfirm();

  async function remove() {
    if (!draft.id) return;
    const ok = await confirm({ message: `Delete this ${config.singular}? This action is audited and cannot be undone.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    startTransition(async () => {
      const response = await fetch(`/api/admin/cms/${config.collection}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draft.id })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setMessage(result.error || 'Delete failed.');
        return;
      }
      const next = records.filter((item) => item.id !== draft.id);
      setRecords(next);
      setDraft(next[0] || emptyRecord(config.fields));
      setSelectedId(next[0]?.id || 'new');
      setMessage('Deleted. The action has been added to audit logs.');
    });
  }

  function exportCsv() {
    window.location.href = `/api/admin/export/${config.collection}`;
  }

  function previewHref() {
    const slug = draft.slug || draft.id;
    if (!slug) return '';
    if (config.collection === 'programs') return `/academics/${slug}`;
    if (config.collection === 'pages') return slug === 'home' ? '/' : `/${slug}`;
    if (config.collection === 'careers') return '/careers/current-openings';
    if (config.collection === 'documents') return draft.file || draft.fileUrl || '';
    return '';
  }

  const tableFields = config.fields.slice(0, 4);

  return (
    <div className="admin-crud">
      <div className="admin-list-panel card">
        <div className="admin-toolbar">
          <div className="search-wrap">
            <input ref={searchRef} aria-label="Search" placeholder={`${t('search')} ${config.title.toLowerCase()}...`} value={query} onChange={(event) => setQuery(event.target.value)} />
            {query && <button className="search-clear" type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
          </div>
          <span className="result-count">{filtered.length} of {records.length}</span>
          <button className="btn outline" type="button" onClick={exportCsv}>{t('export')}</button>
          {!config.readonly ? <button className="btn gold" type="button" onClick={newRecord}>+ {t('add_new')}</button> : null}
        </div>
        {!config.readonly && selectedIds.length > 0 && (
          <div className="bulk-bar">
            <span>{selectedIds.length} selected</span>
            <button className="btn outline" onClick={() => { selectedIds.forEach((id) => fetch(`/api/admin/cms/${config.collection}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, data: { status: 'published' } }) })); setTimeout(() => window.location.reload(), 500); }}>Publish</button>
            <button className="btn outline" onClick={() => { selectedIds.forEach((id) => fetch(`/api/admin/cms/${config.collection}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, data: { status: 'draft' } }) })); setTimeout(() => window.location.reload(), 500); }}>Draft</button>
            <button className="btn danger" onClick={async () => { const ok = await confirm({ message: `Delete ${selectedIds.length} records? This cannot be undone.`, confirmLabel: 'Delete All', danger: true }); if (!ok) return; selectedIds.forEach((id) => fetch(`/api/admin/cms/${config.collection}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })); setTimeout(() => window.location.reload(), 500); }}>Delete</button>
            <button className="btn outline" onClick={() => setSelectedIds([])}>Clear</button>
          </div>
        )}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr>{!config.readonly && <th style={{ width: 32 }}><input type="checkbox" checked={selectedIds.length === sorted.length && sorted.length > 0} onChange={(e) => setSelectedIds(e.target.checked ? sorted.map((r) => r.id).filter(Boolean) : [])} /></th>}{tableFields.map((field) => <th key={field.name} className="sortable-th" onClick={() => toggleSort(field.name)}>{field.label}{sortField === field.name && <span className="sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}</th>)}<th className="sortable-th" onClick={() => toggleSort('status')}>Status{sortField === 'status' && <span className="sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}</th></tr></thead>
            <tbody>
              {sorted.map((record) => (
                <tr key={record.id || JSON.stringify(record).slice(0, 20)} onClick={() => select(record)} onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, record }); }} className={record.id === selectedId ? 'selected' : ''}>
                  {!config.readonly && <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, record.id] : selectedIds.filter((x) => x !== record.id))} /></td>}
                  {tableFields.map((field) => <td key={field.name}>{displayValue(record[field.name]).slice(0, 90)}</td>)}
                  <td><StatusBadge value={record.status || record.severity || record.action} /></td>
                </tr>
              ))}
              {!sorted.length ? <tr><td colSpan={tableFields.length + 1} className="empty-hint" style={{ textAlign: 'center', padding: 40 }}>No records yet. Click <strong>+ New</strong> to create one.</td></tr> : null}
            </tbody>
          </table>
        </div>
        {ctxMenu && <RowContextMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)} onEdit={() => { select(ctxMenu.record); setCtxMenu(null); }} onDelete={() => { setDraft(ctxMenu.record); setCtxMenu(null); remove(); }} onDuplicate={() => { setSelectedId('new'); setDraft({ ...ctxMenu.record, id: undefined, slug: '' }); setCtxMenu(null); }} previewHref={previewHref()} />}
      </div>
      <div className="admin-form-panel card">
        <div className="admin-editor-toolbar">
          <div><h2>{selectedId === 'new' ? `New ${config.singular}` : `Edit ${config.singular}`}{dirty && <span className="unsaved-dot" title="Unsaved changes">●</span>}</h2><p>{config.description}</p></div>
          <div className="actions mini">
            {previewHref() ? <a className="btn outline" href={previewHref()} target="_blank" rel="noreferrer">Preview</a> : null}
            {!config.readonly && <button className="btn gold" type="button" disabled={isPending} onClick={() => save()}>{isPending ? '...' : t('save')}</button>}
            {!config.readonly && <button className="btn outline" type="button" disabled={isPending} onClick={() => save('draft')}>{t('draft')}</button>}
            {!config.readonly && <button className="btn outline" type="button" disabled={isPending} onClick={() => save('published')}>{t('publish')}</button>}
            {!config.readonly && draft.id ? <button className="btn danger" type="button" disabled={isPending} onClick={remove}>{t('delete')}</button> : null}
          </div>
        </div>
        {['pages', 'programs', 'notices', 'blogs', 'events'].includes(config.collection) && (
          <LivePreview title={draft.title} body={draft.body || draft.overview} summary={draft.summary} image={draft.image} collection={config.collection} />
        )}
        <form className="admin-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
          {['pages', 'programs', 'notices'].includes(config.collection) && (
            <label className="locale-selector">
              Content Language
              <select value={draft.locale || 'en'} onChange={(e) => update('locale', e.target.value)}>
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
            </label>
          )}
          {config.fields.length > 5 ? (
            <FormTabsView fields={config.fields} draft={draft} onChange={update} errors={fieldErrors} />
          ) : (
            config.fields.map((field) => <FormField key={field.name} field={field} record={draft} onChange={update} error={fieldErrors[field.name]} />)
          )}
          {message ? <p className={`admin-toast ${message.includes('Saved') || message.includes('Deleted') ? 'toast-success' : message.includes('failed') || message.includes('error') ? 'toast-error' : 'toast-info'}`} role="status">{message}</p> : null}
        </form>
      </div>
      <ConfirmDialog />
    </div>
  );
}
