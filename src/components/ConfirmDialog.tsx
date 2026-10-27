import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel }: {
  title: string; children: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog className="confirm-dialog" ref={ref} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id={titleId}>{title}</h2><div className="confirm-description">{children}</div>
    <div className="confirm-actions"><button className="button secondary" autoFocus onClick={onCancel}>キャンセル</button><button className="button danger" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>;
}
