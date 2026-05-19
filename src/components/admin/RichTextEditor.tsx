'use client';

import { useEffect, useRef } from 'react';

export function RichTextEditor({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || '';
  }, [value]);

  function command(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML || '');
  }

  return (
    <div className="richtext-wrap">
      <div className="richtext-toolbar" aria-label={`${label} formatting toolbar`}>
        <button type="button" onClick={() => command('bold')}><b>B</b></button>
        <button type="button" onClick={() => command('italic')}><i>I</i></button>
        <button type="button" onClick={() => command('insertUnorderedList')}>• List</button>
        <button type="button" onClick={() => command('formatBlock', 'h2')}>H2</button>
        <button type="button" onClick={() => command('formatBlock', 'p')}>P</button>
      </div>
      <div
        className="richtext-editor"
        ref={ref}
        contentEditable
        role="textbox"
        aria-label={label}
        onInput={() => onChange(ref.current?.innerHTML || '')}
        suppressContentEditableWarning
      />
    </div>
  );
}
