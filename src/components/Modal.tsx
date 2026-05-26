import type { ReactNode } from 'react';

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-forti-mute hover:text-forti-ink text-2xl leading-none">×</button>
        </div>
        <div className="mb-5">{children}</div>
        {footer && <div className="flex justify-start gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'אישור', danger = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className={danger ? 'btn-primary' : 'btn-accent'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
          <button className="btn-ghost" onClick={onClose}>ביטול</button>
        </>
      }
    >
      <p className="text-forti-mute">{message}</p>
    </Modal>
  );
}
