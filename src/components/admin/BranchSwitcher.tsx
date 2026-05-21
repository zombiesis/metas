'use client';
import { useEffect, useState } from 'react';

type Branch = { id: string; name: string; slug: string; status: string };

export function BranchSwitcher() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [current, setCurrent] = useState('');

  useEffect(() => {
    const saved = document.cookie.match(/metas_branch=([^;]+)/)?.[1] || '';
    setCurrent(saved);
    fetch('/api/admin/branches').then(r => r.json()).then(d => {
      if (d.ok) setBranches(d.branches);
    }).catch(() => {});
  }, []);

  function switchBranch(branchId: string) {
    document.cookie = `metas_branch=${branchId};path=/;max-age=${60 * 60 * 24 * 365}`;
    setCurrent(branchId);
    window.location.reload();
  }

  if (branches.length <= 1) return null;

  const activeBranch = branches.find(b => b.id === current) || branches[0];

  return (
    <div className="branch-switcher">
      <select
        aria-label="Switch branch"
        value={current || activeBranch?.id || ''}
        onChange={(e) => switchBranch(e.target.value)}
      >
        {branches.filter(b => b.status === 'active').map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}
