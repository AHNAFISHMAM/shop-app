import { useState } from 'react'
import PropTypes from 'prop-types'

/**
 * StarRating Component
 *
 * Displays star ratings with support for both display-only and interactive modes.
 *
 * @param {number} rating - Current rating (0-5)
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {boolean} interactive - Whether stars are clickable
 * @param {Function} onChange - Callback when rating changes (interactive mode only)
 * @param {boolean} showValue - Whether to show numeric value
 */
function StarRating({ rating = 0, size = 'md', interactive = false, onChange, showValue = false }) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value)
    }
  }

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => {
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
                ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
                ${interactive ? '' : 'pointer-events-none'}
              `}
              aria-label={`${value} star${value !== 1 ? 's' : ''}`}
            >
              <svg
                className={`${sizeClass} ${
                  filled ? 'text-yellow-400' : 'text-[var(--text-muted)]'
                } transition-colors`}
                fill={filled ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        <span className="text-sm font-medium text-[var(--text-main)]">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  )
}

export default StarRating

StarRating.propTypes = {
  rating: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  interactive: PropTypes.bool,
  onChange: PropTypes.func,
  showValue: PropTypes.bool
}
