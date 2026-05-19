'use client';

import { useState } from 'react';
import { DropZone } from '@/components/admin/DropZone';

export function MediaUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState('');

  async function handleUpload(files: File[]) {
    setUploading(true);
    setResult('');
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      form.append('title', file.name.replace(/\.[^.]+$/, ''));
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      if (!res.ok) { setResult(`Failed to upload ${file.name}`); setUploading(false); return; }
    }
    setResult(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully.`);
    setUploading(false);
    setTimeout(() => window.location.reload(), 1000);
  }

  return (
    <div>
      <DropZone onUpload={handleUpload} />
      {uploading && <p style={{ marginTop: 10, fontSize: '.82rem', color: 'var(--gold)' }}>Uploading...</p>}
      {result && <p style={{ marginTop: 10, fontSize: '.82rem', color: result.includes('Failed') ? '#ef4444' : '#22c55e', fontWeight: 600 }}>{result}</p>}
    </div>
  );
}
