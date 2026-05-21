'use client';
import { useEffect } from 'react';

/**
 * Decoy system — shows misleading info to anyone inspecting the site.
 * Makes hackers waste time on fake endpoints and fake tech stack.
 */
export function Decoy() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    // Fake console messages suggesting wrong tech stack
    const css = 'color:#999;font-size:11px';
    console.log('%c[Laravel v11.2] Application booted in 42ms', css);
    console.log('%c[MySQL 8.0] Connection pool: 5/20 active', css);
    console.log('%c[Redis] Cache hit ratio: 94.2%', css);
    console.log('%c⚠️ Security: All actions are monitored and logged.', 'color:red;font-weight:bold');

    // Inject fake meta tags suggesting PHP/Laravel
    const fakeMeta = document.createElement('meta');
    fakeMeta.name = 'generator';
    fakeMeta.content = 'Laravel 11.2';
    document.head.appendChild(fakeMeta);

    // Fake global variables that suggest different architecture
    (window as any).__LARAVEL_CONFIG = { version: '11.2', env: 'production', debug: false };
    (window as any).__PHP_SESSION = 'disabled';
    (window as any).__CSRF_TOKEN = 'fake_' + Math.random().toString(36).slice(2);
  }, []);

  return null;
}
