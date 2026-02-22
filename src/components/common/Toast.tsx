import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircleIcon, XCircleIcon, InfoCircleIcon, XMarkIcon } from '@/components/icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const typeConfig: Record<ToastType, { border: string; icon: ReactNode; iconColor: string }> = {
  success: {
    border: 'border-l-success-500',
    icon: <CheckCircleIcon className="h-5 w-5" />,
    iconColor: 'text-success-500',
  },
  error: {
    border: 'border-l-danger-500',
    icon: <XCircleIcon className="h-5 w-5" />,
    iconColor: 'text-danger-500',
  },
  info: {
    border: 'border-l-brand-500',
    icon: <InfoCircleIcon className="h-5 w-5" />,
    iconColor: 'text-brand-500',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => {
          const config = typeConfig[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className={`animate-slide-in flex max-w-sm items-start gap-3 rounded-lg border-l-4 ${config.border} bg-surface px-4 py-3 shadow-lg`}
            >
              <span className={`shrink-0 ${config.iconColor}`}>{config.icon}</span>
              <p className="flex-1 text-sm font-medium text-text-primary">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="닫기"
                className="shrink-0 rounded p-0.5 text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
