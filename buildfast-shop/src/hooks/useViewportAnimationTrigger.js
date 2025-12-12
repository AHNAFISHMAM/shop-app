import { useCallback, useEffect, useState, useRef } from 'react'

/**
 * Optimized viewport animation trigger with IntersectionObserver
 * and requestAnimationFrame throttling for better performance
 */
export function useViewportAnimationTrigger() {
  const [container, setContainer] = useState(null)
  const observerRef = useRef(null)
  const rafRef = useRef(null)
  
  const containerRef = useCallback((node) => {
    setContainer(node ?? null)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !container) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      // Activate all animations immediately
      container.querySelectorAll('[data-animate]').forEach((el) => {
        el.dataset.animateActive = 'true'
        el.style.willChange = 'auto'
      })
      return
    }

    const elements = new Set()
    let pendingUpdates = new Set()

    const updateElements = () => {
      const elementsArray = Array.from(pendingUpdates)
      const viewportHeight = window.innerHeight
      
      // Find the last visible element
      let lastVisibleIndex = -1
      elementsArray.forEach((el, index) => {
        const rect = el.getBoundingClientRect()
        if (rect.top < viewportHeight && rect.bottom > 0) {
          lastVisibleIndex = index
        }
      })
      
      pendingUpdates.forEach((el, index) => {
        if (el.dataset.animateActive === 'true') return; // Already active
        
        const rect = el.getBoundingClientRect()
        const triggerDistance = 300
        
        // Activate if in viewport, near viewport, or is the next element after last visible
        const inViewport = rect.top < viewportHeight && rect.bottom > 0
        const willEnterViewport = rect.top < viewportHeight + triggerDistance && rect.bottom > -triggerDistance
        const isNextElement = lastVisibleIndex >= 0 && elementsArray.indexOf(el) === lastVisibleIndex + 1
        
        if (inViewport || willEnterViewport || isNextElement) {
          el.dataset.animateActive = 'true'
          // Remove will-change after animation completes
          setTimeout(() => {
            if (el.dataset.animateActive === 'true') {
              el.style.willChange = 'auto'
            }
          }, 500)
        }
      })
      pendingUpdates.clear()
      rafRef.current = null
    }

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          pendingUpdates.add(entry.target)
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(updateElements)
          }
        }
      })
    }

    // Create IntersectionObserver with optimized options
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '300px 0px', // Start animation 300px before element enters viewport
      threshold: [0, 0.1, 0.2, 0.5, 1], // Multiple thresholds for better detection
    })

    const collect = () => {
      container.querySelectorAll('[data-animate]').forEach((el) => {
        if (!elements.has(el)) {
          elements.add(el)
          observerRef.current.observe(el)
          // Add will-change when element is about to animate
          el.style.willChange = 'opacity, transform'
        }
      })
    }

    collect()

    // Handle dynamic content
    const mutationObserver = new MutationObserver(() => {
      collect()
    })

    mutationObserver.observe(container, { childList: true, subtree: true })

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      mutationObserver.disconnect()
      elements.forEach((el) => {
        el.style.willChange = 'auto'
      })
    }
  }, [container])

  return containerRef
}


