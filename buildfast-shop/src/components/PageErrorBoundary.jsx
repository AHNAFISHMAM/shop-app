import { Component } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '../utils/logger';

/**
 * Page Error Boundary Wrapper
 * 
 * Wraps ErrorBoundary with route-aware error handling
 * Automatically resets error state on route change
 * 
 * Usage:
 * <PageErrorBoundary>
 *   <YourPageComponent />
 * </PageErrorBoundary>
 */

/* eslint-disable react/prop-types */
class PageErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      location: props.location,
      isLightTheme: typeof document !== 'undefined' && document.documentElement.classList.contains('theme-light')
    };
    this.themeObserver = null;
  }

  componentDidMount() {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      this.setState({
        isLightTheme: document.documentElement.classList.contains('theme-light')
      });
    };
    
    checkTheme();
    
    this.themeObserver = new MutationObserver(checkTheme);
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  componentWillUnmount() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  static getDerivedStateFromProps(props, state) {
    // Reset error state when location changes
    if (props.location?.pathname !== state.location?.pathname && state.hasError) {
      logger.log('Route changed, resetting error boundary');
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        location: props.location
      };
    }
    return { location: props.location };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Page Error Boundary caught error:', error);
    logger.error('Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: this.state.isLightTheme 
              ? 'rgba(255, 255, 255, 0.95)' 
              : 'rgba(5, 5, 9, 0.95)'
          }}
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-red-500" 
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
              <h1 className="text-2xl font-bold text-[var(--text-main)]">
                Something went wrong
              </h1>
              <p className="text-[var(--text-main)]/70">
                We&apos;re sorry, but something unexpected happened on this page. Please try refreshing or navigating away.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border-default)]">
                <p className="text-sm font-semibold text-red-500 mb-2">Error Details (Dev Only):</p>
                <p className="text-xs text-[var(--text-main)]/80 font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-[var(--text-main)]/60 cursor-pointer">
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
                className="px-6 py-2.5 bg-[var(--accent)] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity min-h-[44px]"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-main)] font-semibold rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
/* eslint-enable react/prop-types */

/**
 * Page Error Boundary Component
 * Wraps the inner component with useLocation hook
 */
/* eslint-disable react/prop-types */
function PageErrorBoundary({ children }) {
  const location = useLocation();
  
  return (
    <PageErrorBoundaryInner location={location}>
      {children}
    </PageErrorBoundaryInner>
  );
}
/* eslint-enable react/prop-types */

export default PageErrorBoundary;

