import React from 'react'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

/**
 * LoadingState Component
 *
 * Consistent loading indicator with contextual messages.
 * Based on UX best practices:
 * - Uniform style across application
 * - Contextual information to reduce user anxiety
 * - Lightweight and performant
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  }

  const spinnerSize = sizeClasses[size]

  return (
    <div
      className={
        fullScreen
          ? `fixed inset-0 flex items-center justify-center bg-[var(--bg-main)]/80 backdrop-blur-sm z-50 ${className}`
          : `flex items-center justify-center p-8 ${className}`
      }
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={`${spinnerSize} border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin`}
          aria-hidden="true"
        />
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
      </div>
    </div>
  )
}

export default LoadingState
