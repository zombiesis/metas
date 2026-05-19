'use client';

import { useCallback, useState, type DragEvent } from 'react';

type Props = {
  onUpload: (files: File[]) => void | Promise<void>;
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
};

export function DropZone({ onUpload, accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv', maxSizeMb = 15, multiple = true }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    setError('');
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter((f) => f.size <= maxSizeMb * 1024 * 1024);
    if (valid.length < files.length) setError(`Some files exceeded ${maxSizeMb}MB limit`);
    if (valid.length) onUpload(multiple ? valid : [valid[0]]);
  }, [onUpload, maxSizeMb, multiple]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const files = Array.from(e.target.files || []);
    if (files.length) onUpload(multiple ? files : [files[0]]);
    e.target.value = '';
  }

  return (
    <div
      className={`dropzone ${dragging ? 'dropzone-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
      <p><strong>Drop files here</strong> or click to browse</p>
      <small>Max {maxSizeMb}MB per file • {accept.replace(/\./g, '').replace(/,/g, ', ')}</small>
      {error && <p className="dropzone-error">{error}</p>}
      <input type="file" accept={accept} multiple={multiple} onChange={handleInput} />
    </div>
  );
}
