import { useRef, type ReactNode, type MouseEvent } from 'react';
import './Modal.css';

interface ModalProps {
  onClose: () => void;
  width?: number;
  children: ReactNode;
}

export function Modal({ onClose, width = 480, children }: ModalProps) {
  const mouseDownOnOverlay = useRef(false);

  function handleMouseDown(e: MouseEvent) {
    mouseDownOnOverlay.current = e.target === e.currentTarget;
  }

  function handleClick(e: MouseEvent) {
    if (mouseDownOnOverlay.current && e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={handleMouseDown} onClick={handleClick}>
      <div className="modal-panel" style={{ width }}>
        {children}
      </div>
    </div>
  );
}
