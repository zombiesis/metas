'use client';

import { useState, useEffect } from 'react';

const tips: Record<string, string> = {
  dashboard: 'This is your command center. View metrics, charts, and quick actions at a glance.',
  search: 'Use the search bar to filter records. Try Ctrl+N for new, Ctrl+S to save.',
  sidebar: 'Navigate between Content, CRM, and System sections. Click section headers to collapse.',
  security: 'Enable 2FA, change your password, and manage active sessions here.',
  sorting: 'Click any column header to sort. Click again to reverse the order.',
};

export function OnboardingTips() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const keys = Object.keys(tips);

  useEffect(() => {
    if (localStorage.getItem('admin-onboarded')) return;
    setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem('admin-onboarded', '1');
  }

  function next() {
    if (current < keys.length - 1) setCurrent(current + 1);
    else dismiss();
  }

  if (!visible) return null;

  return (
    <div className="onboarding-tip">
      <div className="onboarding-content">
        <span className="onboarding-step">{current + 1}/{keys.length}</span>
        <strong>{keys[current].charAt(0).toUpperCase() + keys[current].slice(1)}</strong>
        <p>{tips[keys[current]]}</p>
        <div className="onboarding-actions">
          <button className="btn outline" onClick={dismiss}>Skip all</button>
          <button className="btn gold" onClick={next}>{current < keys.length - 1 ? 'Next' : 'Done'}</button>
        </div>
      </div>
    </div>
  );
}
