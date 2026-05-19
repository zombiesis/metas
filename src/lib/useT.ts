'use client';

import { useEffect, useState } from 'react';
import { t, getLocale, type Locale } from '@/lib/i18n';

export function useT() {
  const [locale, setLocale] = useState<Locale>('en');
  useEffect(() => { setLocale(getLocale()); }, []);
  return (key: string) => t(key, locale);
}
