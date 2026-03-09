import React from 'react';

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
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {/* Warning icon — inline SVG, no external dependencies */}
          <svg
            aria-hidden="true"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-danger, #E2445C)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <h3
            style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--color-text-main, #323338)',
            }}
          >
            出了点问题
          </h3>

          {this.state.error?.message && (
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--color-text-muted, #676879)',
                maxWidth: '360px',
                lineHeight: 1.5,
              }}
            >
              {this.state.error.message}
            </p>
          )}

          <button
            type="button"
            onClick={this.resetErrorBoundary}
            style={{
              marginTop: '8px',
              padding: '9px 20px',
              backgroundColor: 'var(--color-primary, #6161FF)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-primary-dark, #4B4EC9)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-primary, #6161FF)';
            }}
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
