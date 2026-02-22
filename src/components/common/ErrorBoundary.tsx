import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@/components/icons';
import Button from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-full bg-danger-50 p-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-danger-500" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">예상치 못한 오류가 발생했습니다</h3>
          <p className="max-w-md text-center text-sm text-text-secondary">
            {this.state.error?.message}
          </p>
          <Button
            variant="primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
