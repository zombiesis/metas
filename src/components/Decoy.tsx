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
    console.log('%c[PHP 8.3.4] OPcache: enabled', css);
    console.log('%c⚠️ Security: All actions are monitored and logged. Unauthorized access will be reported to CERT-In.', 'color:red;font-weight:bold');

    // Inject fake meta tags suggesting PHP/Laravel
    const metas = [
      { name: 'generator', content: 'Laravel 11.2' },
      { name: 'csrf-param', content: '_token' },
      { name: 'framework', content: 'laravel' },
    ];
    metas.forEach(m => { const el = document.createElement('meta'); el.name = m.name; el.content = m.content; document.head.appendChild(el); });

    // Fake global variables that suggest different architecture
    (window as any).__LARAVEL_CONFIG = { version: '11.2', env: 'production', debug: false, db: 'mysql', cache: 'redis' };
    (window as any).__PHP_SESSION = { driver: 'redis', lifetime: 120, secure: true };
    (window as any).__CSRF_TOKEN = 'fake_' + Math.random().toString(36).slice(2);
    (window as any).__APP_KEY = 'base64:FAKE_KEY_DO_NOT_USE_' + Math.random().toString(36);
    (window as any).Laravel = { csrfToken: (window as any).__CSRF_TOKEN, routes: {} };

    // Inject fake HTML comments in body
    const comment1 = document.createComment(' Powered by Laravel 11.2 | PHP 8.3 | MySQL 8.0 ');
    const comment2 = document.createComment(' Session: redis | Cache: redis | Queue: redis ');
    const comment3 = document.createComment(' DO NOT REMOVE: CSRF token validation active ');
    document.body.prepend(comment3, comment2, comment1);

    // Fake hidden form with CSRF token (looks like Laravel)
    const fakeForm = document.createElement('form');
    fakeForm.style.display = 'none';
    fakeForm.innerHTML = `<input type="hidden" name="_token" value="${(window as any).__CSRF_TOKEN}"><input type="hidden" name="_method" value="POST">`;
    document.body.appendChild(fakeForm);

    // Override fetch to add fake headers to responses visible in DevTools
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await origFetch(...args);
      // Can't modify response headers, but the request headers in DevTools will show our app making normal requests
      return res;
    };
  }, []);

  return null;
}
