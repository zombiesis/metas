'use client';
import { useEffect, useState } from 'react';

export function PageTransition() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin) && !anchor.target) {
        setLoading(true);
      }
    };
    document.addEventListener('click', handleClick);
    const observer = new MutationObserver(() => setLoading(false));
    observer.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
    return () => { document.removeEventListener('click', handleClick); observer.disconnect(); };
  }, []);

  if (!loading) return null;
  return <div className="page-loading" />;
}
