import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught an unhandled error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  resetErrorBoundary(): void {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center"
        >
          <AlertTriangle
            aria-hidden="true"
            size={48}
            className="text-danger"
            strokeWidth={1.5}
          />

          <h3 className="m-0 text-lg font-semibold">
            出了点问题
          </h3>

          {this.state.error?.message && (
            <p className="m-0 text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-sm leading-relaxed">
              {this.state.error.message}
            </p>
          )}

          <button
            type="button"
            onClick={this.resetErrorBoundary}
            className="mt-2 px-5 py-2 bg-primary text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-primary/90"
          >
            重新加载
          </button>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

export default ErrorBoundary;
