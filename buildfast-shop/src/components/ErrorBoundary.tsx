import { Component, ReactNode, ErrorInfo } from 'react'
import { logger } from '../utils/logger'

/**
 * ErrorBoundaryProps interface
 */
export interface ErrorBoundaryProps {
  children: ReactNode
}

/**
 * ErrorBoundaryState interface
 */
export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isLightTheme: boolean
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private themeObserver: MutationObserver | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isLightTheme:
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('theme-light'),
    }
  }

  override componentDidMount() {
    if (typeof document === 'undefined') return

    const checkTheme = () => {
      this.setState({
        isLightTheme: document.documentElement.classList.contains('theme-light'),
      })
    }

    checkTheme()

    this.themeObserver = new MutationObserver(checkTheme)
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  override componentWillUnmount() {
    if (this.themeObserver) {
      this.themeObserver.disconnect()
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    logger.error('Error caught by ErrorBoundary:', error)
    logger.error('Error Info:', errorInfo)

    // Store error info in state for display
    this.setState({
      error,
      errorInfo,
    })

    // In production, send to error tracking service
    // if (import.meta.env.PROD) {
    //   errorTrackingService.captureException(error, {
    //     contexts: { react: errorInfo }
    //   });
    // }
  }

  handleReload = () => {
    // Reset error boundary state
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Reload the page
    window.location.reload()
  }

  handleGoHome = () => {
    // Reset error boundary state
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Navigate to home
    window.location.href = '/'
  }

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: this.state.isLightTheme
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(5, 5, 9, 0.95)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <div
                className="mx-auto w-16 h-16 rounded-full bg-[var(--status-error-bg)] flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  className="w-8 h-8 text-[var(--color-red)]"
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
              <h1 className="text-2xl font-bold text-[var(--text-main)]">Something went wrong</h1>
              <p className="text-[var(--text-muted)]">
                We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>

            {((import.meta as any).env?.DEV || (import.meta as any).env?.MODE === 'development') &&
              this.state.error && (
                <div className="text-left bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border-default)]">
                  <p className="text-sm font-semibold text-[var(--color-red)] mb-2">
                    Error Details (Dev Only):
                  </p>
                  <p className="text-sm text-[var(--text-muted)] font-mono break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-sm text-[var(--text-muted)] cursor-pointer">
                        Stack Trace
                      </summary>
                      <pre className="text-sm text-[var(--text-muted)] mt-2 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="min-h-[44px] px-6 py-2.5 bg-[var(--accent)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label="Refresh page"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="min-h-[44px] px-6 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label="Go to home page"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
