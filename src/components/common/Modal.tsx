import { useEffect, useRef, useId, useState, type ReactNode } from 'react';
import { XMarkIcon } from '@/components/icons';
import Button from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const EXIT_DURATION = 150; // scale-out / fade-out 애니메이션 시간과 동일

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // open → visible 전환 (exit 애니메이션 지원)
  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, EXIT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || closing) return;

    // 열기 전 포커스 저장
    previousFocusRef.current = document.activeElement as HTMLElement;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);

    // 포커스 트랩
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleTab);

    // 모달 내부 첫 포커스 요소로 이동
    requestAnimationFrame(() => {
      if (!dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      focusable[0]?.focus();
    });

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleTab);
      // 포커스 복원
      previousFocusRef.current?.focus();
    };
  }, [visible, closing, onClose]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${sizeClasses[size]} rounded-xl bg-surface shadow-overlay ${closing ? 'animate-scale-out' : 'animate-scale-in'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-primary px-5 py-4">
          <h3 id={titleId} className="text-base font-semibold text-text-primary">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1 text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && <div className="flex justify-end gap-2 border-t border-border-primary px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ── ConfirmDialog ── */

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '확인',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </Modal>
  );
}
