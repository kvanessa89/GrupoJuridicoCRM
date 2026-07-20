import type { ReactNode } from 'react';
import { Modal } from './Modal';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  icon?: ReactNode;
  confirmLabel?: string;
  confirmingLabel?: string;
  isConfirming?: boolean;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const trashIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </svg>
);

export function ConfirmDialog({
  title,
  message,
  icon = trashIcon,
  confirmLabel = 'Eliminar',
  confirmingLabel = 'Eliminando…',
  isConfirming = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel} width={420}>
      <div className="confirm-dialog">
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-icon">{icon}</div>
          <div className="confirm-dialog-title">{title}</div>
        </div>
        <div className="confirm-dialog-message">{message}</div>
        <div className="confirm-dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isConfirming || confirmDisabled}>
            {isConfirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
