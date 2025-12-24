import { memo } from 'react'
import { m } from 'framer-motion'
import { staggerContainer, fadeSlideUp } from '../animations/menuAnimations'

interface EmptyMenuStateProps {
  onClearFilters: () => void
  prefersReducedMotion: boolean
}

const EmptyMenuState = memo(({ onClearFilters, prefersReducedMotion }: EmptyMenuStateProps) => {
  return (
    <m.div
      className="flex flex-col items-center justify-center py-20"
      variants={prefersReducedMotion ? {} : staggerContainer}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      custom={0.58}
      role="status"
      aria-live="polite"
      aria-label="No menu items found"
    >
      <m.svg
        className="w-24 h-24 text-[var(--text-secondary)]/30 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        variants={prefersReducedMotion ? {} : fadeSlideUp}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </m.svg>
      <m.p
        className="text-lg text-[var(--text-secondary)] mb-2"
        variants={prefersReducedMotion ? {} : fadeSlideUp}
      >
        No dishes found
      </m.p>
      <m.p
        className="text-sm text-[var(--text-secondary)]/70 mb-4"
        variants={prefersReducedMotion ? {} : fadeSlideUp}
      >
        Try adjusting your filters or search
      </m.p>
      <m.button
        onClick={onClearFilters}
        className="btn-outline text-sm px-4 py-3 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        variants={prefersReducedMotion ? {} : fadeSlideUp}
        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        aria-label="Clear all filters and search"
        type="button"
      >
        Clear Filters
      </m.button>
    </m.div>
  )
})

EmptyMenuState.displayName = 'EmptyMenuState'

export default EmptyMenuState
