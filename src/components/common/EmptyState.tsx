import type { ReactNode } from 'react';
import { InboxIcon } from '@/components/icons';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  message?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  message = 'No data available',
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border-primary bg-surface-secondary p-10 text-center">
      <span className="text-text-tertiary">{icon ?? <InboxIcon className="h-10 w-10" />}</span>
      <p className="text-sm font-medium text-text-secondary">{message}</p>
      {description && <p className="text-xs text-text-tertiary">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
