'use client';

import { useState } from 'react';

type Props = {
  title?: string;
  body?: string;
  summary?: string;
  image?: string;
  collection: string;
};

export function LivePreview({ title, body, summary, image, collection }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="preview-toggle" type="button" onClick={() => setOpen(true)}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Preview
      </button>
    );
  }

  return (
    <div className="live-preview">
      <div className="live-preview-header">
        <span>Live Preview</span>
        <button type="button" onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="live-preview-frame">
        {image && <img src={image} alt="" className="live-preview-img" />}
        <h1 className="live-preview-title">{title || 'Untitled'}</h1>
        {summary && <p className="live-preview-summary">{summary}</p>}
        {body ? (
          <div className="live-preview-body" dangerouslySetInnerHTML={{ __html: body }} />
        ) : (
          <p className="live-preview-empty">Start typing to see preview...</p>
        )}
      </div>
    </div>
  );
}
