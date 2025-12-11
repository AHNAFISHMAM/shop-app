import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop Component
 *
 * Automatically scrolls to the top of the page when the route changes.
 * This ensures that when users click links, they start at the top of the new page
 * instead of staying at their previous scroll position.
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll to top smoothly when pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' for immediate scroll, 'smooth' for animated
    })
  }, [pathname])

  return null // This component doesn't render anything
}

export default ScrollToTop
