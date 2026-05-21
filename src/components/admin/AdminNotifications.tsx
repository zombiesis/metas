'use client';
import { useEffect, useState } from 'react';

type Notification = { id: string; event: string; data: any; time: number };

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource('/api/admin/notifications/stream');
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.addEventListener('form_submitted', (e) => {
      const data = JSON.parse(e.data);
      setNotifications(prev => [{ id: crypto.randomUUID(), event: 'New form submission', data, time: Date.now() }, ...prev].slice(0, 20));
    });
    es.addEventListener('admission_lead', (e) => {
      const data = JSON.parse(e.data);
      setNotifications(prev => [{ id: crypto.randomUUID(), event: 'New admission inquiry', data, time: Date.now() }, ...prev].slice(0, 20));
    });
    es.addEventListener('content_published', (e) => {
      const data = JSON.parse(e.data);
      setNotifications(prev => [{ id: crypto.randomUUID(), event: 'Content published', data, time: Date.now() }, ...prev].slice(0, 20));
    });
    return () => es.close();
  }, []);

  if (!notifications.length) return null;

  return (
    <div className="admin-notifications-panel">
      <div className="notif-header">
        <span className={`notif-dot ${connected ? 'green' : 'red'}`} />
        <strong>Live ({notifications.length})</strong>
      </div>
      {notifications.slice(0, 5).map(n => (
        <div key={n.id} className="notif-item">
          <span className="notif-event">{n.event}</span>
          <span className="notif-time">{new Date(n.time).toLocaleTimeString()}</span>
        </div>
      ))}
      <style>{`
        .admin-notifications-panel{position:fixed;bottom:16px;right:16px;width:300px;background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);padding:12px;z-index:9000;font-size:0.85rem}
        .notif-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .notif-dot{width:8px;height:8px;border-radius:50%}
        .notif-dot.green{background:#10b981}.notif-dot.red{background:#ef4444}
        .notif-item{padding:6px 0;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between}
        .notif-time{color:#999;font-size:0.75rem}
      `}</style>
    </div>
  );
}
