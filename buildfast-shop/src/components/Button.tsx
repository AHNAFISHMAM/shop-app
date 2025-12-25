import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  disabledReason?: string
  children: React.ReactNode
}

/**
 * Button Component
 *
 * Enhanced button with better disabled state visibility and loading states.
 * Based on UX best practices:
 * - Distinct styling for disabled states
 * - Tooltips explaining why disabled
 * - Loading indicators with contextual feedback
 * - Minimum 44px touch target
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      loading = false,
      disabledReason,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const baseClasses =
      'px-6 py-3 rounded-lg font-medium transition min-h-[44px] flex items-center justify-center gap-2 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2'

    const variantClasses = {
      primary:
        'bg-[var(--accent)] text-black hover:bg-[var(--accent)]/90 disabled:opacity-40 disabled:grayscale-[0.3] focus:ring-[var(--accent)]',
      secondary:
        'bg-theme-elevated border border-theme text-[var(--text-main)] hover:bg-theme disabled:opacity-40 disabled:grayscale-[0.3] focus:ring-[var(--accent)]',
      ghost:
        'bg-transparent text-[var(--text-main)] hover:bg-theme-elevated disabled:opacity-40 disabled:grayscale-[0.3] focus:ring-[var(--accent)]',
      danger:
        'bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:grayscale-[0.3] focus:ring-red-500',
    }

    return (
      <div className="relative inline-block group">
        <button
          ref={ref}
          {...props}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          aria-busy={loading}
          title={isDisabled && disabledReason ? disabledReason : props.title}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        >
          {loading && (
            <div
              className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"
              aria-hidden="true"
            />
          )}
          <span className={loading ? 'opacity-0' : ''}>{children}</span>
        </button>
        {isDisabled && disabledReason && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg"
            role="tooltip"
          >
            {disabledReason}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
          </div>
        )}
      </div>
    )
  }
)

Button.displayName = 'Button'

export default Button
