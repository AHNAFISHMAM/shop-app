import { memo, useMemo, useState, useEffect, useCallback } from 'react'
import {
  parseEffects,
  parseEffectVariants,
  buildEffectVariants,
  CAPTION_EFFECT_KEYS,
} from '../utils/effects'

const CAPTION_DEPENDENT_EFFECTS = new Set(CAPTION_EFFECT_KEYS)

/**
 * GalleryCardProps interface
 */
export interface GalleryCardProps {
  defaultImage: string
  hoverImage: string
  effect?: string | string[]
  alt?: string
  caption?: string
  effectVariants?: string | string[] | string[][]
}

/**
 * GalleryCard Component
 *
 * Displays a card with two images (default + hover) and optional layered animations.
 * Animation effects are applied via CSS classes derived from the `effect` prop.
 *
 * @param {GalleryCardProps} props - Component props
 */
const GalleryCard = memo(function GalleryCard({
  defaultImage,
  hoverImage,
  effect = 'crossfade',
  alt = 'Gallery image',
  caption = undefined,
  effectVariants = undefined,
}: GalleryCardProps) {
  const baseEffects = useMemo(() => parseEffects(effect), [effect])
  const variantSequence = useMemo(() => {
    if (effectVariants !== undefined && effectVariants !== null) {
      const variants =
        typeof effectVariants === 'string'
          ? effectVariants
          : Array.isArray(effectVariants)
            ? JSON.stringify(effectVariants)
            : null
      return parseEffectVariants(variants, baseEffects)
    }
    return buildEffectVariants(baseEffects)
  }, [effectVariants, baseEffects])
  const [hoverSequence, setHoverSequence] = useState<number>(0)

  useEffect(() => {
    setHoverSequence(0)
  }, [variantSequence])

  const variantCount = variantSequence.length || 1
  // Memoize activeVariant to prevent dependency issues
  const activeVariant = useMemo(
    () => variantSequence[hoverSequence % variantCount] || [],
    [variantSequence, hoverSequence, variantCount]
  )

  const effectClassNames = useMemo(
    () => (activeVariant || []).map((effectName: string) => `gallery-card-${effectName}`).join(' '),
    [activeVariant]
  )

  const needsCaption = useMemo(
    () =>
      (activeVariant || []).some((effectName: string) => CAPTION_DEPENDENT_EFFECTS.has(effectName)),
    [activeVariant]
  )

  const captionContent = needsCaption ? (caption ?? alt ?? '') : undefined

  const advanceHoverSequence = useCallback(() => {
    setHoverSequence(prev => prev + 1)
  }, [])

  return (
    <div
      data-caption={captionContent}
      className={`gallery-card ${effectClassNames} relative overflow-hidden rounded-lg aspect-[4/3] bg-[var(--bg-main)] shadow-xl`}
      onMouseLeave={advanceHoverSequence}
      onTouchEnd={advanceHoverSequence}
      onBlur={advanceHoverSequence}
      role="img"
      aria-label={alt}
    >
      {/* Default Image */}
      <img
        src={defaultImage}
        alt={alt}
        className="gallery-card-default absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        aria-hidden="true"
      />

      {/* Hover Image */}
      <img
        src={hoverImage}
        alt={`${alt} (hover state)`}
        className="gallery-card-hover absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        aria-hidden="true"
      />
    </div>
  )
})

export default GalleryCard
