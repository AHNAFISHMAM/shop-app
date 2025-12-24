import { Component, type ReactNode, type ErrorInfo } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import { logger } from '../utils/logger'

/**
 * Page Error Boundary Inner Component Props
 */
interface PageErrorBoundaryInnerProps {
  location: Location
  children: ReactNode
}

/**
 * Page Error Boundary Inner Component State
 */
interface PageErrorBoundaryInnerState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  location: Location
  isLightTheme: boolean
}

/**
 * Page Error Boundary Inner Component
 *
 * Wraps ErrorBoundary with route-aware error handling.
 * Automatically resets error state on route change.
 *
 * Features:
 * - Route-aware error reset
 * - Theme-aware fallback UI
 * - Development error details
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 */
class PageErrorBoundaryInner extends Component<
  PageErrorBoundaryInnerProps,
  PageErrorBoundaryInnerState
> {
  private themeObserver: MutationObserver | null = null

  constructor(props: PageErrorBoundaryInnerProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      location: props.location,
      isLightTheme:
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('theme-light'),
    }
    this.themeObserver = null
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

  static getDerivedStateFromProps(
    props: PageErrorBoundaryInnerProps,
    state: PageErrorBoundaryInnerState
  ): Partial<PageErrorBoundaryInnerState> | null {
    // Reset error state when location changes
    if (props.location?.pathname !== state.location?.pathname && state.hasError) {
      logger.log('Route changed, resetting error boundary')
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        location: props.location,
      }
    }
    return { location: props.location }
  }

  static getDerivedStateFromError(error: Error): Partial<PageErrorBoundaryInnerState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Page Error Boundary caught error:', error)
    logger.error('Error Info:', errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  override render() {
    if (this.state.hasError) {
      const isDev = import.meta.env?.DEV || import.meta.env?.MODE === 'development'

      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: this.state.isLightTheme
              ? 'rgba(var(--text-main-rgb), 0.95)'
              : 'rgba(var(--bg-dark-rgb), 0.95)',
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
              <p className="text-[var(--text-main)]/70">
                We&apos;re sorry, but something unexpected happened on this page. Please try
                refreshing or navigating away.
              </p>
            </div>

            {isDev && this.state.error && (
              <div className="text-left bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border-default)]">
                <p className="text-sm font-semibold text-[var(--color-red)] mb-2">
                  Error Details (Dev Only):
                </p>
                <p className="text-sm text-[var(--text-main)]/80 font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-[var(--text-muted)] cursor-pointer min-h-[44px] flex items-center">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-[var(--text-main)]/80 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 bg-[var(--accent)] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label="Refresh the page"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
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

/**
 * Page Error Boundary Component Props
 */
interface PageErrorBoundaryProps {
  children: ReactNode
}

/**
 * Page Error Boundary Component
 *
 * Wraps the inner component with useLocation hook.
 * Automatically resets error state on route changes.
 *
 * Usage:
 * ```tsx
 * <PageErrorBoundary>
 *   <YourPageComponent />
 * </PageErrorBoundary>
 * ```
 */
function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  const location = useLocation()

  return <PageErrorBoundaryInner location={location}>{children}</PageErrorBoundaryInner>
}

export default PageErrorBoundary
