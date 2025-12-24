import { useState, useEffect, ChangeEvent } from 'react'
import { getCurrencySymbol } from '../../lib/priceUtils'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  minPrice: string
  maxPrice: string
  onMinPriceChange: (price: string) => void
  onMaxPriceChange: (price: string) => void
  onApply: () => void
  onClearAll: () => void
}

/**
 * Filter Drawer Component
 * Slide-in drawer for advanced filtering options
 * Follows 2025 mobile-first UX best practices
 */
const FilterDrawer = ({
  isOpen,
  onClose,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onApply,
  onClearAll,
}: FilterDrawerProps): JSX.Element | null => {
  const [localMinPrice, setLocalMinPrice] = useState(minPrice)
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice)

  useEffect(() => {
    setLocalMinPrice(minPrice)
    setLocalMaxPrice(maxPrice)
  }, [minPrice, maxPrice])

  const handleApply = () => {
    onMinPriceChange(localMinPrice)
    onMaxPriceChange(localMaxPrice)
    onApply()
    onClose()
  }

  const handleClear = () => {
    setLocalMinPrice('')
    setLocalMaxPrice('')
    onClearAll()
  }

  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm z-40 animate-fade-in"
        style={{
          backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full sm:w-96 border-l border-theme z-50 animate-slide-in-right shadow-2xl"
        style={{
          backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-theme">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--accent)]">Filters</h2>
              <p className="text-[10px] sm:text-xs text-muted mt-1">Refine your search</p>
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] w-10 h-10 flex items-center justify-center rounded-xl sm:rounded-2xl transition-colors"
              style={{
                backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'rgba(255, 255, 255, 0.05)'
              }}
              aria-label="Close filters"
            >
              <svg
                className="w-5 h-5 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div
            data-overlay-scroll
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-4 md:gap-6 space-y-6"
          >
            {/* Price Range Section */}
            <div>
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <svg
                  className="w-5 h-5 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                  Price Range
                </h3>
              </div>

              <div className="gap-3 sm:gap-4 md:gap-6 space-y-4">
                {/* Min Price */}
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-muted block mb-2">
                    Minimum Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] font-medium">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={localMinPrice}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setLocalMinPrice(e.target.value)
                      }
                      placeholder="0"
                      min="0"
                      className="w-full min-h-[44px] pl-8 px-4 sm:px-6 py-3 bg-theme-elevated border border-theme rounded-xl sm:rounded-2xl text-sm sm:text-base text-[var(--text-main)] placeholder:text-muted focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Max Price */}
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-muted block mb-2">
                    Maximum Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] font-medium">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={localMaxPrice}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setLocalMaxPrice(e.target.value)
                      }
                      placeholder="No limit"
                      min="0"
                      className="w-full min-h-[44px] pl-8 px-4 sm:px-6 py-3 bg-theme-elevated border border-theme rounded-xl sm:rounded-2xl text-sm sm:text-base text-[var(--text-main)] placeholder:text-muted focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Price Range Preview */}
                {(localMinPrice || localMaxPrice) && (
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl sm:rounded-2xl">
                    <svg
                      className="w-4 h-4 text-[var(--accent)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-[10px] sm:text-xs text-[var(--text-main)]">
                      Showing items{' '}
                      {localMinPrice ? `from ${getCurrencySymbol('BDT')}${localMinPrice}` : ''}
                      {localMinPrice && localMaxPrice ? ' to ' : ''}
                      {localMaxPrice ? `${getCurrencySymbol('BDT')}${localMaxPrice}` : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Future: Add more filter options here */}
            {/* Dietary Preferences, Spice Level, Ratings, etc. */}
          </div>

          {/* Footer Actions */}
          <div
            className="px-4 sm:px-6 py-3 sm:py-4 border-t border-theme backdrop-blur-sm"
            style={{
              backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
            }}
          >
            <div className="flex gap-3 sm:gap-4 md:gap-6">
              <button
                onClick={handleClear}
                className="flex-1 min-h-[44px] px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated text-sm sm:text-base text-[var(--text-main)] font-medium transition-all"
                style={{
                  backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = isLightTheme
                    ? 'rgba(0, 0, 0, 0.08)'
                    : 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = isLightTheme ? 'rgba(0, 0, 0, 0.04)' : ''
                }}
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 min-h-[44px] px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl bg-[var(--accent)] text-sm sm:text-base text-black font-semibold hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FilterDrawer
