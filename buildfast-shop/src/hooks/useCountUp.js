import { useEffect, useState } from 'react'

/**
 * Custom hook for animating numbers from 0 to target value
 * Creates a smooth count-up effect for dashboard statistics
 *
 * @param {number} end - Target number to count up to
 * @param {number} duration - Animation duration in milliseconds (default: 1500)
 * @param {number} delay - Delay before starting animation (default: 0)
 * @returns {number} - Current animated value
 *
 * @example
 * const animatedRevenue = useCountUp(totalRevenue, 1500, 200)
 */
export function useCountUp(end, duration = 1500, delay = 0) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Don't animate if end value is 0
    if (end === 0) {
      setCount(0)
      return
    }

    // Wait for delay before starting
    const delayTimeout = setTimeout(() => {
      const startTime = Date.now()
      const startValue = 0

      // Easing function for smooth animation (ease-out cubic)
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

      const animate = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime

        if (elapsed < duration) {
          // Calculate progress (0 to 1)
          const progress = elapsed / duration
          const easedProgress = easeOutCubic(progress)

          // Calculate current value
          const currentValue = startValue + (end - startValue) * easedProgress
          setCount(Math.floor(currentValue))

          // Continue animation
          requestAnimationFrame(animate)
        } else {
          // Animation complete, set to exact end value
          setCount(end)
        }
      }

      // Start animation
      requestAnimationFrame(animate)
    }, delay)

    // Cleanup
    return () => clearTimeout(delayTimeout)
  }, [end, duration, delay])

  return count
}

export default useCountUp
