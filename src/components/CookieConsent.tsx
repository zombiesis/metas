'use client';
import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!document.cookie.includes('cookie_consent=')) setShow(true);
  }, []);

  function accept(level: 'all' | 'essential') {
    document.cookie = `cookie_consent=${level};path=/;max-age=${365 * 86400};SameSite=Lax`;
    setShow(false);
    if (level === 'all') window.dispatchEvent(new CustomEvent('consent-granted'));
  }

  if (!show) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner-content">
        <p>We use cookies to improve your experience. Essential cookies are required for the site to function. Analytics cookies help us understand usage.</p>
        <div className="cookie-banner-actions">
          <button className="btn gold" onClick={() => accept('all')}>Accept All</button>
          <button className="btn outline" onClick={() => accept('essential')}>Essential Only</button>
        </div>
      </div>
      <style>{`
        .cookie-banner{position:fixed;bottom:0;left:0;right:0;background:#071B33;color:#fff;padding:16px 24px;z-index:9999;box-shadow:0 -2px 12px rgba(0,0,0,0.2)}
        .cookie-banner-content{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
        .cookie-banner-content p{flex:1;margin:0;font-size:0.9rem;min-width:200px}
        .cookie-banner-actions{display:flex;gap:8px}
      `}</style>
    </div>
  );
}
