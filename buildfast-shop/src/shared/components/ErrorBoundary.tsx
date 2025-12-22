/**
 * ErrorBoundary Component
 * 
 * React Error Boundary for catching and displaying errors.
 * Provides fallback UI and error reporting.
 */

import { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, resetError: () => void) => ReactNode;
  message?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to error reporting service
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.state.errorInfo!, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-24 w-24 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Something went wrong
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              {this.props.message || 'We encountered an unexpected error. Please try refreshing the page.'}
            </p>
            {this.state.error && !!(import.meta.env?.DEV ?? false) && (
              <details className="text-left mb-6 p-4 bg-[var(--bg-hover)] rounded-lg">
                <summary className="cursor-pointer text-sm font-semibold mb-2">
                  Error Details
                </summary>
                <pre className="text-xs text-[var(--text-secondary)] overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack || ''}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary px-6 py-3"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg border border-theme text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

