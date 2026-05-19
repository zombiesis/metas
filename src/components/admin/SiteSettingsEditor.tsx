'use client';

import { useState, useTransition } from 'react';
import type { SiteSettings } from '@/lib/cms-db';

function listToText(items: string[] | [string, string][]) {
  return (items || []).map((item: any) => Array.isArray(item) ? `${item[0]} | ${item[1]}` : item).join('\n');
}

function textToList(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function textToNavigation(value: string): [string, string][] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [label, href] = line.split('|').map((part) => part.trim());
    return [label || 'Untitled', href || '#'];
  });
}

export function SiteSettingsEditor({ initialSite }: { initialSite: SiteSettings }) {
  const [site, setSite] = useState(initialSite);
  const [values, setValues] = useState(listToText(initialSite.values));
  const [infrastructure, setInfrastructure] = useState(listToText(initialSite.infrastructure));
  const [stats, setStats] = useState(listToText(initialSite.statPlaceholders));
  const [navigation, setNavigation] = useState(listToText(initialSite.navigation));
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function update(path: string, value: string) {
    setSite((current: any) => {
      const next = structuredClone(current);
      const parts = path.split('.');
      let target = next;
      for (const part of parts.slice(0, -1)) target = target[part];
      target[parts.at(-1)!] = value;
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      setMessage('Saving settings...');
      const payload = {
        ...site,
        values: textToList(values),
        infrastructure: textToList(infrastructure),
        statPlaceholders: textToList(stats),
        navigation: textToNavigation(navigation)
      };
      const response = await fetch('/api/admin/site', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(result.error || 'Save failed.'); return; }
      setSite(result.site);
      setMessage('Site settings saved. Header, footer, contact cards, and schema now use the updated content.');
    });
  }

  return (
    <div className="card admin-settings-form">
      <div className="admin-editor-toolbar"><h2>Institution settings</h2><button className="btn gold" onClick={save} disabled={isPending}>{isPending ? 'Saving...' : 'Save Settings'}</button></div>
      <div className="formgrid">
        <label>Institution name<input value={site.name} onChange={(event) => update('name', event.target.value)} /></label>
        <label>Short name<input value={site.shortName} onChange={(event) => update('shortName', event.target.value)} /></label>
        <label>Organization<input value={site.organization} onChange={(event) => update('organization', event.target.value)} /></label>
        <label>Office hours<input value={site.hours} onChange={(event) => update('hours', event.target.value)} /></label>
      </div>
      <label>Mission<textarea value={site.mission} onChange={(event) => update('mission', event.target.value)} /></label>
      <label>Vision<textarea value={site.vision} onChange={(event) => update('vision', event.target.value)} /></label>
      <label>Address<textarea value={site.address} onChange={(event) => update('address', event.target.value)} /></label>
      <div className="formgrid">
        <label>Registrar phone<input value={site.phones.registrar} onChange={(event) => update('phones.registrar', event.target.value)} /></label>
        <label>Admissions phone<input value={site.phones.admissions} onChange={(event) => update('phones.admissions', event.target.value)} /></label>
        <label>Placement phone<input value={site.phones.placement} onChange={(event) => update('phones.placement', event.target.value)} /></label>
        <label>Placement mobile<input value={site.phones.placementMobile} onChange={(event) => update('phones.placementMobile', event.target.value)} /></label>
        <label>Principal email<input value={site.emails.principal} onChange={(event) => update('emails.principal', event.target.value)} /></label>
        <label>Registrar email<input value={site.emails.registrar} onChange={(event) => update('emails.registrar', event.target.value)} /></label>
        <label>Placement email<input value={site.emails.placement} onChange={(event) => update('emails.placement', event.target.value)} /></label>
      </div>
      <label>Values, one per line<textarea value={values} onChange={(event) => setValues(event.target.value)} /></label>
      <label>Infrastructure cards, one per line<textarea value={infrastructure} onChange={(event) => setInfrastructure(event.target.value)} /></label>
      <label>Statistics labels, one per line<textarea value={stats} onChange={(event) => setStats(event.target.value)} /></label>
      <label>Navigation, one item per line as “Label | /url”<textarea value={navigation} onChange={(event) => setNavigation(event.target.value)} /></label>
      {message ? <p className="admin-message">{message}</p> : null}
    </div>
  );
}
