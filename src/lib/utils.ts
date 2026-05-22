export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

export function formBool(value: FormDataEntryValue | null | undefined) {
  return value === 'on' || value === 'true' || value === '1';
}

export function parseDateInput(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

export function csvEscape(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}



/**
 * Safely format any date-like value (string, Date, number) for display.
 *
 * Returns the formatted en-IN date string, or `fallback` if the value is
 * missing or unparseable. Use `format='month-day'` for short labels like
 * "JUL 15" + "2026", or `format='long'` for "15 July 2026".
 *
 * Used by event cards on the homepage where the JSON sometimes ships
 * with `startDate` and sometimes with `date`, and we never want a literal
 * "Invalid Date" string to leak to users.
 */
export function safeFormatDate(
  value: unknown,
  format: 'long' | 'short' = 'long',
  fallback = '',
): string {
  if (value == null || value === '') return fallback;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return fallback;
  if (format === 'short') {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Pick the first defined date-ish field on an event-like record. */
export function pickEventDate(e: Record<string, unknown>): unknown {
  return e.date ?? e.startDate ?? e.start_date ?? e.eventDate ?? e.createdAt ?? null;
}
