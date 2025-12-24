import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop Component
 *
 * Automatically scrolls to the top of the page when the route changes.
 * This ensures that when users click links, they start at the top of the new page
 * instead of staying at their previous scroll position.
 *
 * Features:
 * - Respects prefers-reduced-motion preference
 * - Instant scroll for better UX
 * - No visual output (returns null)
 */
function ScrollToTop(): null {
  const { pathname } = useLocation()

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'instant', // Use 'instant' for immediate scroll
    })
  }, [pathname])

  return null // This component doesn't render anything
}

export default ScrollToTop
