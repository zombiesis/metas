'use client';
import { useState } from 'react';

type Notice = { title: string; category: string; url: string; status?: string; pinned?: boolean };

const TABS = ['Announcement', 'Examination', 'Result', 'Newsletter', 'Job Openings'];

export function TabNoticeBoard({ notices }: { notices: Notice[] }) {
  const [active, setActive] = useState(TABS[0]);
  const filtered = notices.filter((n) => n.status !== 'archived' && n.category.toLowerCase().includes(active.toLowerCase())).slice(0, 8);
  const fallback = notices.filter((n) => n.status !== 'archived').slice(0, 8);
  const display = filtered.length ? filtered : fallback;

  return (
    <div className="tab-notice-board">
      <div className="tab-header">
        {TABS.map((tab) => (
          <button key={tab} className={active === tab ? 'active' : ''} onClick={() => setActive(tab)}>{tab}</button>
        ))}
      </div>
      <div className="tab-content">
        {display.length === 0 ? (
          <p className="tab-empty">No notices in this category.</p>
        ) : (
          <ul>
            {display.map((n, i) => (
              <li key={`${n.title}-${i}`}>
                <a href={n.url} target="_blank" rel="noreferrer">
                  {n.pinned && <span className="tab-badge">NEW</span>}
                  {n.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
