'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const commands = [
  { label: 'Go to Dashboard', action: '/admin/dashboard', group: 'Navigate' },
  { label: 'Go to Pages', action: '/admin/pages', group: 'Navigate' },
  { label: 'Go to Programs', action: '/admin/programs', group: 'Navigate' },
  { label: 'Go to Notices', action: '/admin/notices', group: 'Navigate' },
  { label: 'Go to Documents', action: '/admin/documents', group: 'Navigate' },
  { label: 'Go to Faculty', action: '/admin/faculty', group: 'Navigate' },
  { label: 'Go to Admissions', action: '/admin/admissions', group: 'Navigate' },
  { label: 'Go to Forms', action: '/admin/forms', group: 'Navigate' },
  { label: 'Go to Media', action: '/admin/media', group: 'Navigate' },
  { label: 'Go to Events', action: '/admin/events', group: 'Navigate' },
  { label: 'Go to Blogs', action: '/admin/blogs', group: 'Navigate' },
  { label: 'Go to Analytics', action: '/admin/analytics', group: 'Navigate' },
  { label: 'Go to Security', action: '/admin/security', group: 'Navigate' },
  { label: 'Go to Users', action: '/admin/users', group: 'Navigate' },
  { label: 'Go to Settings', action: '/admin/settings', group: 'Navigate' },
  { label: 'Edit Homepage', action: '/admin/homepage', group: 'Quick Action' },
  { label: 'View Public Site', action: '/', group: 'Quick Action' },
  { label: 'Audit Logs', action: '/admin/audit-logs', group: 'Quick Action' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setOpen(true); setQuery(''); setSelected(0); }
      if (e.key === 'Escape') setOpen(false);
    }
    (window as any).__openCommandPalette = () => { setOpen(true); setQuery(''); setSelected(0); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => { setSelected(0); }, [filtered]);

  function execute(cmd: typeof commands[0]) {
    setOpen(false);
    router.push(cmd.action);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) { execute(filtered[selected]); }
  }

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <input className="cmd-input" aria-label="Command palette" placeholder="Type a command or page name..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} autoFocus />
        <div className="cmd-list">
          {filtered.map((cmd, i) => (
            <button key={cmd.label} className={`cmd-item ${i === selected ? 'cmd-active' : ''}`} onClick={() => execute(cmd)} onMouseEnter={() => setSelected(i)}>
              <span>{cmd.label}</span>
              <small>{cmd.group}</small>
            </button>
          ))}
          {!filtered.length && <p className="cmd-empty">No results</p>}
        </div>
        <div className="cmd-footer"><kbd>↑↓</kbd> navigate <kbd>↵</kbd> select <kbd>esc</kbd> close</div>
      </div>
    </div>
  );
}
