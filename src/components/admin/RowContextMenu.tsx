'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/admin/Icons';

type Props = {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  previewHref?: string;
  onClose: () => void;
};

export function RowContextMenu({ x, y, onEdit, onDelete, onDuplicate, previewHref, onClose }: Props) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    window.addEventListener('scroll', handler);
    return () => { window.removeEventListener('click', handler); window.removeEventListener('scroll', handler); };
  }, [onClose]);

  return (
    <div className="ctx-menu" style={{ top: y, left: x }} role="menu" onClick={(e) => e.stopPropagation()}>
      <button role="menuitem" onClick={onEdit}>{Icon.edit} Edit</button>
      <button role="menuitem" onClick={onDuplicate}>{Icon.copy} Duplicate</button>
      {previewHref && <a role="menuitem" href={previewHref} target="_blank" rel="noreferrer">{Icon.eye} Preview</a>}
      <hr />
      <button role="menuitem" className="ctx-danger" onClick={onDelete}>{Icon.trash} Delete</button>
    </div>
  );
}
