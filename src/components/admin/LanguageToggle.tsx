'use client';

import { useEffect, useState } from 'react';
import { getLocale, setLocale, type Locale } from '@/lib/i18n';

const options: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'हिं' },
  { value: 'gu', label: 'ગુ' },
  { value: 'ta', label: 'தமி' },
  { value: 'te', label: 'తె' },
  { value: 'mr', label: 'मरा' },
  { value: 'bn', label: 'বাং' },
  { value: 'kn', label: 'ಕನ್' },
];

export function LanguageToggle() {
  const [locale, setLoc] = useState<Locale>('en');

  useEffect(() => { setLoc(getLocale()); }, []);

  function change(val: Locale) {
    setLoc(val);
    setLocale(val);
    document.cookie = `admin-locale=${val};path=/;max-age=31536000`;
    window.location.reload();
  }

  return (
    <select className="lang-toggle" value={locale} onChange={(e) => change(e.target.value as Locale)} aria-label="Language">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
