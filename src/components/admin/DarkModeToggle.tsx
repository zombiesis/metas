'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/admin/Icons';

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-dark-mode');
    if (saved === '1') { setDark(true); document.documentElement.classList.add('dark'); }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('admin-dark-mode', next ? '1' : '0');
  }

  return (
    <button className="dark-toggle" type="button" onClick={toggle} aria-label={dark ? 'Light mode' : 'Dark mode'} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? Icon.sun : Icon.moon}
    </button>
  );
}
