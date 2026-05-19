'use client';

import { useState, useTransition } from 'react';
import type { HomepageSection } from '@/lib/cms-db';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

const labels: Record<string, string> = {
  topbar: 'Top utility bar',
  header: 'Header / mega menu',
  hero: 'Hero',
  notices: 'Notice bar',
  welcome: 'Welcome',
  mission: 'Mission / Vision / Values',
  programs: 'Programs',
  why: 'Why Choose Metas',
  stats: 'Statistics',
  admissions: 'Admissions Funnel',
  placements: 'Placement Preview',
  faculty: 'Faculty Spotlight',
  infrastructure: 'Infrastructure',
  accreditation: 'IQAC / Accreditation',
  news: 'News / Events',
  testimonials: 'Testimonials',
  footer: 'Footer'
};

export function HomepageEditorClient({ initialSections }: { initialSections: HomepageSection[] }) {
  const [sections, setSections] = useState(initialSections);
  const [selectedKey, setSelectedKey] = useState(initialSections[0]?.key || 'hero');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const selected = sections.find((section) => section.key === selectedKey) || sections[0];

  function update(field: keyof HomepageSection, value: any) {
    setSections((current) => current.map((section) => section.key === selected.key ? { ...section, [field]: value } : section));
  }

  function save() {
    startTransition(async () => {
      setMessage('Saving homepage sections...');
      const response = await fetch('/api/admin/homepage', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sections }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(result.error || 'Save failed.'); return; }
      setSections(result.sections);
      setMessage('Homepage saved. Public homepage sections now render from CMS/database content.');
    });
  }

  if (!selected) return <p>No homepage sections found. Run the seed script.</p>;

  return (
    <>
    <div className="admin-home-editor">
      <aside className="card admin-section-list">
        {sections.map((section) => <button key={section.key} className={section.key === selectedKey ? 'active' : ''} onClick={() => setSelectedKey(section.key)}><span>{labels[section.key] || section.key}</span><small>{section.visible ? 'Visible' : 'Hidden'} · {section.status}</small></button>)}
      </aside>
      <div className="card admin-section-editor">
        <div className="admin-editor-toolbar">
          <div><h2>{labels[selected.key] || selected.key}</h2><p>Edit with normal fields. No JSON editing required.</p></div>
          <button className="btn gold" onClick={save} disabled={isPending}>{isPending ? 'Saving...' : 'Save Homepage'}</button>
        </div>
        <div className="formgrid">
          <label>Section key<input value={selected.key} readOnly /></label>
          <label>Order<input type="number" value={selected.order} onChange={(event) => update('order', Number(event.target.value))} /></label>
          <label>Status<select value={selected.status} onChange={(event) => update('status', event.target.value)}><option>draft</option><option>published</option><option>archived</option></select></label>
          <label className="admin-check"><input type="checkbox" checked={selected.visible} onChange={(event) => update('visible', event.target.checked)} /> Visible on homepage</label>
        </div>
        <label>Title<input value={selected.title || ''} onChange={(event) => update('title', event.target.value)} /></label>
        <label>Subtitle<input value={selected.subtitle || ''} onChange={(event) => update('subtitle', event.target.value)} /></label>
        <label>Body / section notes<RichTextEditor label={`${selected.key} body`} value={selected.body || ''} onChange={(html) => update('body', html)} /></label>
        {message ? <p className="admin-message">{message}</p> : null}
        <p className="required">For testimonials, keep the placeholder until real admin-approved testimonials exist. For statistics, use “Verified data to be updated” unless data is verified.</p>
      </div>
    </div>
    <HomepagePreview key={message} />
    </>
  );
}


function HomepagePreview() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const widths = { desktop: '100%', tablet: '768px', mobile: '375px' };

  return (
    <div className="homepage-preview-wrap">
      <div className="homepage-preview-header">
        <span>Homepage Preview</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="button" className={`preview-device ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')} title="Desktop">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"/></svg>
          </button>
          <button type="button" className={`preview-device ${device === 'tablet' ? 'active' : ''}`} onClick={() => setDevice('tablet')} title="Tablet">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25V4.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z"/></svg>
          </button>
          <button type="button" className={`preview-device ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')} title="Mobile">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>
          </button>
          <button type="button" className="preview-device" onClick={() => setIframeKey((k) => k + 1)} title="Refresh">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
          </button>
          <a href="/" target="_blank" rel="noreferrer" className="preview-device" title="Open in new tab">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
          </a>
        </div>
      </div>
      <div className="homepage-preview-body" style={{ display: 'flex', justifyContent: 'center', background: '#e2e8f0', padding: device !== 'desktop' ? '16px' : 0 }}>
        <iframe key={iframeKey} src="/" className="homepage-preview-iframe" title="Homepage preview" style={{ width: widths[device], maxWidth: '100%', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}
