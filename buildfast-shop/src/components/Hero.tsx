import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { getBackgroundStyle } from '../utils/backgroundUtils'

/**
 * CTA Button interface
 */
interface CTAButton {
  label: string
  to: string
  variant?: 'outline' | 'primary'
}

/**
 * Hero Image interface
 */
interface HeroImage {
  src: string
  alt?: string
}

/**
 * Hero Component Props
 */
export interface HeroProps {
  id?: string
  title: string
  subtitle?: string
  ctaButtons?: CTAButton[]
  images?: HeroImage[]
  className?: string
}

/**
 * Hero Component
 *
 * Displays a hero section with title, subtitle, CTA buttons, and optional image collage.
 * Supports dynamic background styling from store settings.
 *
 * @component
 * @param props - Hero component props
 */
const Hero: React.FC<HeroProps> = ({
  id,
  title,
  subtitle,
  ctaButtons = [],
  images = [],
  className = '',
}) => {
  const { settings } = useStoreSettings()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  // Note: Theme detection removed as it's not used in this component

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent | { matches: boolean }): void => {
      setPrefersReducedMotion('matches' in e ? e.matches : false)
    }

    if (mediaQuery.addEventListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
    return undefined
  }, [])

  const backgroundStyle = useMemo(() => {
    return settings
      ? getBackgroundStyle(settings as unknown as Record<string, string | null | undefined>, 'hero')
      : {}
  }, [settings])

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>): void => {
    // Optional: Handle image load events
    const img = e.currentTarget
    img.style.opacity = '1'
  }, [])

  return (
    <section
      id={id}
      data-animate={prefersReducedMotion ? undefined : 'fade-scale'}
      data-animate-active="false"
      className={`py-3 sm:py-4 md:py-5 px-4 -mx-4 rounded-xl sm:rounded-2xl ${className}`}
      style={backgroundStyle}
      role="banner"
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
        {/* Left: Content */}
        <div
          data-animate={prefersReducedMotion ? undefined : 'slide-up'}
          data-animate-active="false"
          style={{ transitionDelay: prefersReducedMotion ? undefined : '80ms' }}
          className="space-y-4 sm:space-y-6"
        >
          {subtitle && (
            <p
              className="text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest text-accent"
              aria-label="Hero subtitle"
            >
              {subtitle}
            </p>
          )}
          <h1
            id={id ? `${id}-title` : undefined}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            style={{ color: 'var(--text-main)' }}
          >
            {title}
          </h1>

          {/* CTA Buttons */}
          {ctaButtons.length > 0 && (
            <div
              className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4"
              role="group"
              aria-label="Call to action buttons"
            >
              {ctaButtons.map(button => (
                <Link
                  key={button.label}
                  to={button.to}
                  className={`${button.variant === 'outline' ? 'btn-outline' : 'btn-primary'} min-h-[44px] text-sm sm:text-base px-5 sm:px-6`}
                  aria-label={`${button.label} - ${button.to}`}
                >
                  {button.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Images Collage */}
        {images.length > 0 && (
          <div
            data-animate={prefersReducedMotion ? undefined : 'drift-left'}
            data-animate-active="false"
            style={{ transitionDelay: prefersReducedMotion ? undefined : '140ms' }}
            className="grid grid-cols-2 gap-3 sm:gap-4"
            role="group"
            aria-label="Hero images"
          >
            {images.map((image, index) => (
              <div
                key={image.src}
                data-animate={prefersReducedMotion ? undefined : 'rise'}
                data-animate-active="false"
                style={{
                  transitionDelay: prefersReducedMotion ? undefined : `${220 + index * 90}ms`,
                }}
                className={`rounded-xl sm:rounded-2xl overflow-hidden ${
                  index === 0 ? 'col-span-2' : ''
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt || `Hero image ${index + 1}`}
                  className="w-full h-48 sm:h-56 md:h-64 object-cover hover:scale-105 transition-transform duration-300"
                  style={{
                    transition: prefersReducedMotion ? 'none' : undefined,
                    transform: prefersReducedMotion ? 'none' : undefined,
                  }}
                  onLoad={handleImageLoad}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Hero
