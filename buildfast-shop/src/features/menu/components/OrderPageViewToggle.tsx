/**
 * OrderPageViewToggle Component
 *
 * View mode toggle component for switching between sections and grid views.
 */

import { m } from 'framer-motion'
import { batchFadeSlideUp } from '../../../components/animations/menuAnimations'

interface OrderPageViewToggleProps {
  viewMode: 'sections' | 'grid'
  onViewModeChange: (mode: 'sections' | 'grid') => void
}

/**
 * OrderPageViewToggle Component
 */
export function OrderPageViewToggle({
  viewMode,
  onViewModeChange,
}: OrderPageViewToggleProps): JSX.Element {
  return (
    <m.div
      variants={batchFadeSlideUp}
      className="flex items-center gap-2 p-2 rounded-lg border border-theme-subtle bg-[var(--bg-main)]/78 backdrop-blur-sm"
    >
      <button
        onClick={() => onViewModeChange('sections')}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          viewMode === 'sections'
            ? 'bg-[var(--accent)] text-[#111]'
            : 'text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
        }`}
        aria-label="Sections view"
      >
        <svg
          className="w-4 h-4 inline-block mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        Sections
      </button>
      <button
        onClick={() => onViewModeChange('grid')}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          viewMode === 'grid'
            ? 'bg-[var(--accent)] text-[#111]'
            : 'text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
        }`}
        aria-label="Grid view"
      >
        <svg
          className="w-4 h-4 inline-block mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        Grid
      </button>
    </m.div>
  )
}
