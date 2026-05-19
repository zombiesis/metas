'use client';

import { useState } from 'react';

type Props = {
  collection: string;
  selectedIds: string[];
  onComplete: () => void;
  onClear: () => void;
};

export function BulkActions({ collection, selectedIds, onComplete, onClear }: Props) {
  const [loading, setLoading] = useState(false);

  if (!selectedIds.length) return null;

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} records? This action is audited.`)) return;
    setLoading(true);
    for (const id of selectedIds) {
      await fetch(`/api/admin/cms/${collection}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    }
    setLoading(false);
    onComplete();
  }

  async function bulkStatus(status: string) {
    setLoading(true);
    for (const id of selectedIds) {
      await fetch(`/api/admin/cms/${collection}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, data: { status } }) });
    }
    setLoading(false);
    onComplete();
  }

  return (
    <div className="bulk-bar">
      <span>{selectedIds.length} selected</span>
      <button className="btn outline" disabled={loading} onClick={() => bulkStatus('published')}>Publish</button>
      <button className="btn outline" disabled={loading} onClick={() => bulkStatus('draft')}>Draft</button>
      <button className="btn danger" disabled={loading} onClick={bulkDelete}>Delete</button>
      <button className="btn outline" onClick={onClear}>Clear</button>
    </div>
  );
}
