'use client';
import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export function TurnstileWidget({ onVerify }: { onVerify?: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      document.head.appendChild(script);
    }
    // Render widget when script loads
    const interval = setInterval(() => {
      if ((window as any).turnstile && ref.current && !ref.current.hasChildNodes()) {
        (window as any).turnstile.render(ref.current, { sitekey: SITE_KEY, callback: (token: string) => onVerify?.(token) });
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [onVerify]);

  if (!SITE_KEY) return null; // Don't render in dev without key
  return <div ref={ref} className="turnstile-widget" />;
}

/** Hidden input version for native forms */
export function TurnstileHidden() {
  if (!SITE_KEY) return null;
  return (
    <div className="cf-turnstile" data-sitekey={SITE_KEY} data-callback="onTurnstileVerify" />
  );
}
