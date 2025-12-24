import { useState, useCallback, useMemo } from 'react'

/**
 * StarRating component props
 */
interface StarRatingProps {
  /** Current rating (0-5) */
  rating?: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether stars are clickable */
  interactive?: boolean
  /** Callback when rating changes (interactive mode only) */
  onChange?: (value: number) => void
  /** Whether to show numeric value */
  showValue?: boolean
}

/**
 * StarRating Component
 *
 * Displays star ratings with support for both display-only and interactive modes.
 *
 * Features:
 * - Display-only and interactive modes
 * - Hover effects in interactive mode
 * - Multiple size variants
 * - Optional numeric value display
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 */
function StarRating({
  rating = 0,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0)

  const sizeClasses = useMemo(
    () => ({
      sm: 'w-4 h-4',
      md: 'w-6 h-6 min-w-[44px] min-h-[44px]',
      lg: 'w-8 h-8 min-w-[44px] min-h-[44px]',
    }),
    []
  )

  const sizeClass = sizeClasses[size] || sizeClasses.md

  const handleClick = useCallback(
    (value: number) => {
      if (interactive && onChange) {
        onChange(value)
      }
    },
    [interactive, onChange]
  )

  const handleMouseEnter = useCallback(
    (value: number) => {
      if (interactive) {
        setHoverRating(value)
      }
    },
    [interactive]
  )

  const handleMouseLeave = useCallback(() => {
    if (interactive) {
      setHoverRating(0)
    }
  }, [interactive])

  const displayRating = hoverRating || rating

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map(value => {
          const filled = value <= displayRating

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`
                ${interactive ? 'cursor-pointer hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2' : 'cursor-default'}
                ${interactive ? '' : 'pointer-events-none'}
                min-h-[44px] min-w-[44px]
              `}
              aria-label={`${value} star${value !== 1 ? 's' : ''}`}
              aria-pressed={filled}
              role={interactive ? 'radio' : undefined}
              aria-checked={interactive ? filled : undefined}
            >
              <svg
                className={`${sizeClass} ${
                  filled ? 'text-[var(--color-amber)]' : 'text-[var(--text-muted)]'
                } transition-colors`}
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          )
        })}
      </div>

      {showValue && (
        <span
          className="text-sm font-medium text-[var(--text-main)]"
          aria-label={`${rating > 0 ? rating.toFixed(1) : '0.0'} out of 5`}
        >
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  )
}

export default StarRating
