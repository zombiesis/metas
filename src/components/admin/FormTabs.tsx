'use client';

import { useState, type ReactNode } from 'react';

type Tab = { id: string; label: string; children: ReactNode };

export function FormTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id || '');

  return (
    <div className="form-tabs">
      <div className="form-tabs-nav" role="tablist">
        {tabs.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={active === tab.id} className={`form-tab ${active === tab.id ? 'active' : ''}`} onClick={() => setActive(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="form-tabs-content" role="tabpanel">
        {tabs.find((t) => t.id === active)?.children}
      </div>
    </div>
  );
}

/** Helper to split fields into tab groups based on field name patterns */
export function groupFieldsIntoTabs(fields: { name: string }[]): { content: string[]; seo: string[]; settings: string[] } {
  const seo = fields.filter((f) => /seo|meta/i.test(f.name)).map((f) => f.name);
  const settings = fields.filter((f) => /status|publish|visibility|pinned|spotlight|contactVisible/i.test(f.name)).map((f) => f.name);
  const content = fields.filter((f) => !seo.includes(f.name) && !settings.includes(f.name)).map((f) => f.name);
  return { content, seo, settings };
}
