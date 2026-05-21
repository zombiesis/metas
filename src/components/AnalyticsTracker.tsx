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

    // GA4 integration — only loads if consent granted and GA_MEASUREMENT_ID is set
    const gaId = (document.querySelector('meta[name="ga-id"]') as HTMLMetaElement)?.content;
    if (gaId && document.cookie.includes('cookie_consent=all')) {
      loadGA4(gaId);
    }
    // Listen for consent granted event
    function onConsent() { if (gaId) loadGA4(gaId); }
    window.addEventListener('consent-granted', onConsent);

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
    return () => { document.removeEventListener('click', onClick); window.removeEventListener('consent-granted', onConsent); };
  }, []);
  return null;
}

function loadGA4(measurementId: string) {
  if (document.querySelector(`script[src*="gtag"]`)) return;
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
  gtag('js', new Date());
  gtag('config', measurementId, { anonymize_ip: true });
}
