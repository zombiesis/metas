'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/admin/Icons';

type SecurityEvent = { id: string; event: string; severity: string; summary: string; createdAt: string };

export function NotificationBell() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/cms/security-events?limit=10&page=1');
    const data = await res.json();
    if (data.ok) setEvents(data.data || []);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  const warnings = events.filter((e) => e.severity === 'warning' || e.severity === 'critical');

  return (
    <div className="notif-bell-wrap">
      <button className="notif-bell" type="button" onClick={() => setOpen(!open)} aria-label="Notifications">
        {Icon.bell}
        {warnings.length > 0 && <span className="notif-badge">{warnings.length}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Recent Security Events</div>
          {!loaded && <p className="notif-empty">Loading...</p>}
          {loaded && events.length === 0 && <p className="notif-empty">No recent events</p>}
          {events.slice(0, 8).map((e) => (
            <div key={e.id} className={`notif-item notif-${e.severity}`}>
              <strong>{e.event.replace(/_/g, ' ')}</strong>
              <span>{e.summary || ''}</span>
            </div>
          ))}
          {events.length > 0 && <a className="notif-footer" href="/admin/security">View all →</a>}
        </div>
      )}
    </div>
  );
}
