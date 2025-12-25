import { useState, useEffect } from 'react'
import { useStoreSettings } from '../contexts/StoreSettingsContext'

/**
 * Hook to determine if animations should be reduced
 * Automatically reduces animations if Supabase is failing or user prefers reduced motion
 * 
 * @returns true if animations should be reduced/disabled
 */
export function useReducedAnimations(): boolean {
  const { loading, settings } = useStoreSettings()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [supabaseFailed, setSupabaseFailed] = useState(false)

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  // Check if Supabase failed (still loading after timeout suggests failure)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        // If still loading after 6 seconds, assume Supabase failed
        // This helps reduce animations when Supabase is having issues
        setSupabaseFailed(true)
      }, 6000)
      return () => clearTimeout(timer)
    } else {
      // Reset when loading completes
      setSupabaseFailed(false)
    }
  }, [loading])

  // Reduce animations if user prefers it OR if Supabase is failing
  return prefersReducedMotion || supabaseFailed
}

