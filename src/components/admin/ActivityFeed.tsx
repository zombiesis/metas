'use client';

import { useEffect, useState } from 'react';

type Activity = { id: string; action: string; entityType: string; summary: string; createdAt: string };

export function ActivityFeed() {
  const [items, setItems] = useState<Activity[]>([]);

  useEffect(() => {
    fetch('/api/admin/cms/audit-logs?limit=5&page=1')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setItems(d.data || []); })
      .catch(() => {});
  }, []);

  if (!items.length) return <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>No recent activity.</p>;

  return (
    <div className="activity-feed">
      {items.map((item) => (
        <div key={item.id} className="activity-item">
          <span className="activity-action">{item.action.replace(/_/g, ' ')}</span>
          <span className="activity-summary">{item.summary || item.entityType}</span>
          <time className="activity-time">{new Date(item.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
        </div>
      ))}
    </div>
  );
}
