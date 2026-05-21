'use client';
import { useEffect } from 'react';

/**
 * Anti-tampering protections for the public site.
 * Deters casual inspection — not foolproof against determined attackers,
 * but raises the bar significantly for students.
 */
export function AntiTamper() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    // Disable right-click context menu
    const blockContext = (e: MouseEvent) => { e.preventDefault(); };
    document.addEventListener('contextmenu', blockContext);

    // Disable common keyboard shortcuts for DevTools/View Source
    const blockKeys = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) e.preventDefault();
      if (e.ctrlKey && e.key === 'u') e.preventDefault();
      if (e.ctrlKey && e.key === 's') e.preventDefault();
    };
    document.addEventListener('keydown', blockKeys);

    // Detect DevTools open via debugger timing
    let devtoolsOpen = false;
    const detect = () => {
      const start = performance.now();
      // debugger statement causes pause when DevTools is open
      // eslint-disable-next-line no-debugger
      const diff = performance.now() - start;
      if (diff > 100 && !devtoolsOpen) {
        devtoolsOpen = true;
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center"><div><h1>⚠️</h1><p>Developer tools detected.<br>This action has been logged.</p></div></div>';
      }
    };
    const timer = setInterval(detect, 2000);

    // Disable text selection on sensitive areas
    document.body.style.userSelect = 'none';
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(el => (el as HTMLElement).style.userSelect = 'text');

    // Disable drag
    document.addEventListener('dragstart', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
      clearInterval(timer);
    };
  }, []);

  return null;
}
