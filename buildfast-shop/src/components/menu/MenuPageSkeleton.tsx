import { memo, useMemo } from 'react'
import { m } from 'framer-motion'
import {
  staggerContainer,
  fadeSlideUp,
  gridReveal,
  batchFadeSlideUp,
} from '../animations/menuAnimations'

interface MenuPageSkeletonProps {
  isLightTheme: boolean
  prefersReducedMotion: boolean
}

const MenuPageSkeleton = memo(({ isLightTheme, prefersReducedMotion }: MenuPageSkeletonProps) => {
  const skeletonBgColor = useMemo(() => {
    return isLightTheme ? 'var(--bg-hover)' : 'rgba(255, 255, 255, 0.05)' // Fixed: Different colors for light/dark
  }, [isLightTheme])

  const animationVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    }
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    }
  }, [prefersReducedMotion])

  return (
    <m.main
      className="space-y-10"
      variants={animationVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ pointerEvents: 'auto' }}
      role="main"
      aria-label="Menu page"
      aria-busy="true"
      aria-live="polite"
    >
      <m.div
        className="text-center space-y-4 py-12"
        variants={prefersReducedMotion ? {} : staggerContainer}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate={prefersReducedMotion ? false : 'visible'}
      >
        <m.div
          className="h-8 rounded w-64 mx-auto animate-pulse"
          variants={prefersReducedMotion ? {} : fadeSlideUp}
          style={{ backgroundColor: skeletonBgColor }}
          aria-hidden="true"
        />
        <m.div
          className="h-4 rounded w-96 mx-auto animate-pulse"
          variants={prefersReducedMotion ? {} : fadeSlideUp}
          style={{ backgroundColor: skeletonBgColor }}
          aria-hidden="true"
        />
      </m.div>

      <m.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={prefersReducedMotion ? {} : gridReveal}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate={prefersReducedMotion ? false : 'visible'}
      >
        {[...Array(6)].map((_, i) => (
          <m.div
            key={i}
            className="rounded-2xl overflow-hidden border border-[var(--border-default)] animate-pulse"
            variants={prefersReducedMotion ? {} : batchFadeSlideUp}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-default)',
            }}
            aria-hidden="true"
          >
            <div className="h-48" style={{ backgroundColor: skeletonBgColor }} />
            <div className="p-4 space-y-3">
              <div className="h-4 rounded w-3/4" style={{ backgroundColor: skeletonBgColor }} />
              <div className="h-3 rounded w-full" style={{ backgroundColor: skeletonBgColor }} />
              <div className="h-10 rounded-full" style={{ backgroundColor: skeletonBgColor }} />
            </div>
          </m.div>
        ))}
      </m.div>
    </m.main>
  )
})

MenuPageSkeleton.displayName = 'MenuPageSkeleton'

export default MenuPageSkeleton
