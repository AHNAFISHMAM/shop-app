import { useCallback, useEffect, useState } from 'react'

/**
 * Ensures any elements inside the provided container that are already
 * within the viewport fire their data-animate transition immediately.
 * Also re-checks on scroll/resize and when DOM nodes are added.
 */
export function useViewportAnimationTrigger() {
  const [container, setContainer] = useState(null)
  const containerRef = useCallback((node) => {
    setContainer(node ?? null)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !container) return

    const observed = new Set()

    const collect = () => {
      container.querySelectorAll('[data-animate]').forEach((el) => {
        observed.add(el)
      })
    }

    const triggerVisible = () => {
      observed.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const inView = rect.top < window.innerHeight && rect.bottom > 0
        if (inView) {
          el.dataset.animateActive = 'true'
        }
      })
    }

    collect()
    triggerVisible()

    const handleViewport = () => {
      triggerVisible()
    }

    window.addEventListener('scroll', handleViewport, { passive: true })
    window.addEventListener('resize', handleViewport)

    const mutationObserver = new MutationObserver(() => {
      collect()
      triggerVisible()
    })

    mutationObserver.observe(container, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('scroll', handleViewport)
      window.removeEventListener('resize', handleViewport)
      mutationObserver.disconnect()
    }
  }, [container])

  return containerRef
}


