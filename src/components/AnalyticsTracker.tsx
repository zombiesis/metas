'use client';

import { useEffect } from 'react';

function getSessionId() {
  const key = 'metas_session_id';
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
  }
  return value;
}

function track(event: string, payload: Record<string, unknown> = {}) {
  const body = JSON.stringify({ event, path: location.pathname, sessionId: getSessionId(), ...payload });
  if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }));
  else fetch('/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => null);
}

export function AnalyticsTracker() {
  useEffect(() => {
    track('page_view');
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a') as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const label = link.textContent?.trim() || href;
      if (href.startsWith('tel:')) track('phone_click', { label, value: href });
      else if (href.startsWith('mailto:')) track('email_click', { label, value: href });
      else if (href.includes('wa.me') || href.includes('whatsapp')) track('whatsapp_click', { label, value: href });
      else if (href.toLowerCase().includes('.pdf') || href.includes('/documents/')) track('pdf_download', { label, value: href });
      else if (/apply|admission/i.test(label + href)) track('admission_cta_click', { label, value: href });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
