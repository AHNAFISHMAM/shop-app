/**
 * PageErrorBoundary Component
 *
 * Error boundary specifically for page-level errors.
 * Provides a user-friendly error page.
 */

import { Link } from 'react-router-dom'
import { ReactNode } from 'react'
import ErrorBoundary from './ErrorBoundary'
import { m } from 'framer-motion'
import { fadeSlideUp } from '../../components/animations/menuAnimations'

interface PageErrorBoundaryProps {
  children: ReactNode
  pageName?: string
}

/**
 * PageErrorBoundary Component
 *
 * Wraps pages with error boundary and provides page-specific error UI.
 */
export function PageErrorBoundary({
  children,
  pageName = 'page',
}: PageErrorBoundaryProps): JSX.Element {
  const fallback = (error: Error, errorInfo: React.ErrorInfo, resetError: () => void) => (
    <m.div
      className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] px-4"
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-md w-full text-center">
        <m.div className="mb-6" variants={fadeSlideUp}>
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
        </m.div>
        <m.h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2" variants={fadeSlideUp}>
          Oops! Something went wrong
        </m.h1>
        <m.p className="text-[var(--text-secondary)] mb-6" variants={fadeSlideUp}>
          We encountered an error while loading the {pageName}. Please try again or return to the
          homepage.
        </m.p>
        {error && !!(import.meta.env?.DEV ?? false) && (
          <m.details
            className="text-left mb-6 p-4 bg-[var(--bg-hover)] rounded-lg"
            variants={fadeSlideUp}
          >
            <summary className="cursor-pointer text-sm font-semibold mb-2">Error Details</summary>
            <pre className="text-xs text-[var(--text-secondary)] overflow-auto">
              {error.toString()}
              {errorInfo?.componentStack || ''}
            </pre>
          </m.details>
        )}
        <m.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={fadeSlideUp}>
          <button onClick={resetError} className="btn-primary px-6 py-3">
            Try Again
          </button>
          <Link
            to="/"
            className="px-6 py-3 rounded-lg border border-theme text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors text-center"
          >
            Go Home
          </Link>
        </m.div>
      </div>
    </m.div>
  )

  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>
}
