'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ConfirmOptions = { title?: string; message: string; confirmLabel?: string; danger?: boolean };

let globalConfirm: (opts: ConfirmOptions) => Promise<boolean> = () => Promise.resolve(false);

export function useConfirm() {
  return globalConfirm;
}

export function ConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ message: '' });
  const resolveRef = useRef<(v: boolean) => void>(undefined);

  const requestConfirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => { resolveRef.current = resolve; });
  }, []);

  // Publish the imperative API outside of render so the component stays pure.
  useEffect(() => {
    globalConfirm = requestConfirm;
    return () => {
      globalConfirm = () => Promise.resolve(false);
    };
  }, [requestConfirm]);

  function respond(value: boolean) {
    setOpen(false);
    resolveRef.current?.(value);
  }

  if (!open) return null;
  return (
    <div className="confirm-overlay" onClick={() => respond(false)} onKeyDown={(e) => { if (e.key === 'Escape') respond(false); }}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">{opts.title || 'Confirm action'}</h3>
        <p>{opts.message}</p>
        <div className="confirm-actions">
          <button className="btn outline" onClick={() => respond(false)}>Cancel</button>
          <button className={`btn ${opts.danger ? 'danger' : 'gold'}`} onClick={() => respond(true)} autoFocus>{opts.confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
