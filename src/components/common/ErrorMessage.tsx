import { ExclamationTriangleIcon } from '@/components/icons';
import Button from './Button';

interface ErrorMessageProps {
  error: unknown;
  onRetry?: () => void;
}

export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';

  return (
    <div className="flex items-start gap-3 rounded-lg border border-danger-500/20 bg-danger-50 p-4">
      <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-danger-500" />
      <div className="flex flex-col gap-2">
        <p className="text-sm text-danger-600">{message}</p>
        {onRetry && (
          <Button variant="danger" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        )}
      </div>
    </div>
  );
}
