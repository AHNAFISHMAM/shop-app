import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { m } from 'framer-motion'
import SectionTitle from '../components/SectionTitle'
import GalleryCard from '../components/GalleryCard'
import { parseEffects, parseEffectVariants } from '../utils/effects'
import { supabase } from '../lib/supabase'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { getBackgroundStyle } from '../utils/backgroundUtils'
import { useTheme as _useTheme } from '../shared/hooks/use-theme'
import { pageFade } from '../components/animations/menuAnimations'
import { logger } from '../utils/logger'

/**
 * Interface for value item structure
 */
interface ValueItem {
  title: string
  description: string
}

/**
 * Interface for purpose highlight structure
 */
interface PurposeHighlight {
  title: string
  description: string
}

/**
 * Interface for gallery card structure
 */
interface GalleryCard {
  id: string
  default_image_url: string
  hover_image_url?: string
  effect?: string
  effect_variants?: string
  caption?: string
  position: number
  is_active: boolean
}

/**
 * About Page Component
 *
 * Displays information about Star Café, including values, purpose, and gallery.
 *
 * @component
 */
const AboutPage = memo((): JSX.Element => {
  const { settings } = useStoreSettings()
  // const isLightTheme = useTheme()
  const [galleryCards, setGalleryCards] = useState<GalleryCard[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

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

  const ourValues = useMemo<ValueItem[]>(
    () => [
      {
        title: 'Quality',
        description:
          'We use fresh ingredients and maintain consistent taste in every dish we serve.',
      },
      {
        title: 'Hospitality',
        description:
          'Respectful, attentive service that makes every guest feel welcomed and valued.',
      },
      {
        title: 'Authenticity',
        description:
          'Traditional recipes prepared with care, honoring the flavors of our heritage.',
      },
    ],
    []
  )

  const purposeHighlights = useMemo<PurposeHighlight[]>(
    () => [
      {
        title: 'Purpose',
        description:
          'Craft memorable dining moments with honest flavors, thoughtful service, and a space that feels like home.',
      },
      {
        title: 'Promise',
        description:
          'Blend tradition with modern comfort so every visit feels warm, reliable, and worth sharing.',
      },
    ],
    []
  )

  const fetchGalleryCards = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('gallery_cards')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true })

      if (fetchError) {
        logger.error('Error fetching gallery cards:', fetchError)
        setGalleryCards([])
        setError(`Database error: ${fetchError.message}`)
        return
      }

      setGalleryCards((data || []) as GalleryCard[])
      if (!data || data.length === 0) {
        setError('No active gallery cards found. Please add cards in the admin panel.')
      }
    } catch (err: unknown) {
      logger.error('Error in fetchGalleryCards:', err)
      setGalleryCards([])
      const errorMessage =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Unknown error'
      setError(`Failed to load gallery: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch gallery cards from database
  useEffect(() => {
    let isMounted = true

    const loadGallery = async () => {
      await fetchGalleryCards()
    }

    loadGallery()

    // Real-time subscription for gallery updates
    const channel = supabase
      .channel('public:gallery_cards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_cards',
        },
        () => {
          if (isMounted) {
            fetchGalleryCards()
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [fetchGalleryCards])

  return (
    <m.main
      className="space-y-20"
      variants={prefersReducedMotion ? {} : pageFade}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      style={{
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible',
      }}
      role="main"
      aria-label="About Star Café"
    >
      {/* Hero */}
      <section
        data-animate="fade-scale"
        data-animate-active="false"
        className="glow-surface glow-soft relative overflow-hidden rounded-2xl sm:rounded-3xl border border-theme bg-gradient-to-br from-[var(--accent)]/10 via-background to-[var(--accent)]/5 py-12 sm:py-14 md:py-16 shadow-lg"
        aria-labelledby="about-hero-heading"
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]"
          aria-hidden="true"
        />
        <div className="hero-container relative text-center space-y-4 sm:space-y-6 px-4">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-xs tracking-[0.2em] uppercase text-[var(--accent)]"
            role="status"
            aria-label="About Star Café"
          >
            About Star Café
          </span>
          <h1
            id="about-hero-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
            style={{ color: 'var(--text-main)' }}
          >
            The Story of Star Café
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            A modern café and restaurant in Jessore, focused on consistent taste, comfort, and
            hospitality.
          </p>
          <div
            className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-3xl mx-auto"
            role="list"
            aria-label="Purpose and promise"
          >
            {purposeHighlights.map((item, index) => (
              <article
                key={item.title}
                data-animate="fade-rise"
                data-animate-active="false"
                style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${index * 120}ms` }}
                className="glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-background/70 backdrop-blur p-4 sm:p-5 text-left shadow-lg"
                role="listitem"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]"
                  aria-hidden="true"
                />
                <div className="relative space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section aria-labelledby="values-heading">
        <div
          data-animate="drift-left"
          data-animate-active="false"
          className="glow-surface glow-soft relative mt-8 overflow-hidden rounded-2xl sm:rounded-[32px] border border-theme bg-gradient-to-br from-[var(--accent)]/10 via-background to-[var(--accent)]/5 p-6 sm:p-8 md:p-10 shadow-xl"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]"
            aria-hidden="true"
          />
          <div className="relative space-y-8">
            <div className="text-center space-y-2 sm:space-y-3">
              <p className="text-sm sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.35em] text-[var(--accent)]/80">
                Guiding Principles
              </p>
              <h2
                id="values-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight"
                style={{ color: 'var(--text-main)' }}
              >
                Our Values
              </h2>
              <p className="text-sm md:text-base text-muted leading-relaxed">
                The principles that guide everything we do
              </p>
              <p className="mx-auto max-w-2xl text-sm text-muted md:text-base leading-relaxed">
                One promise: every guest feels at home while savoring honest flavors crafted with
                care.
              </p>
            </div>
            <div
              className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Our values"
            >
              {ourValues.map((value, index) => (
                <article
                  key={value.title}
                  data-animate="blur-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${index * 120}ms` }}
                  className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl border border-theme-subtle bg-background/60 p-5 sm:p-6 shadow-md transition-colors duration-300 hover:border-[var(--accent)]/30 hover:bg-background/80"
                  role="listitem"
                >
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_65%)] opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(255,255,255,0.05),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <div className="relative space-y-3">
                    <span
                      className="inline-flex items-center rounded-full bg-[var(--accent)]/15 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]/80"
                      role="status"
                    >
                      {value.title}
                    </span>
                    <p className="text-sm text-muted leading-relaxed">{value.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery with Dynamic Hover Effects */}
      <section
        data-animate="drift-right"
        data-animate-active="false"
        className="glow-surface glow-soft relative overflow-hidden py-10 sm:py-12 px-4 -mx-4 rounded-2xl sm:rounded-3xl border border-theme bg-gradient-to-br from-[var(--accent)]/10 via-background to-[var(--accent)]/5 shadow-inner"
        style={settings ? getBackgroundStyle(settings as any, 'gallery_section') : {}}
        aria-labelledby="gallery-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]"
          aria-hidden="true"
        />
        <SectionTitle
          title="Experience Our Space"
          subtitle="Hover to see our café transform"
          align="center"
        />
        <h2 id="gallery-heading" className="sr-only">
          Gallery of Star Café
        </h2>

        {loading ? (
          <div
            className="flex justify-center items-center py-12"
            role="status"
            aria-live="polite"
            aria-label="Loading gallery"
          >
            <div
              className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--accent)] border-t-transparent"
              aria-hidden="true"
            ></div>
            <span className="sr-only">Loading gallery images...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12" role="alert" aria-live="assertive">
            <div className="max-w-md mx-auto p-6 rounded-xl border border-[var(--status-error-border)] bg-[var(--status-error-bg)]">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-[var(--color-red)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm mb-2 text-[var(--color-red)] font-semibold">
                Gallery Loading Error
              </p>
              <p className="text-xs text-muted">{error}</p>
            </div>
          </div>
        ) : galleryCards.length > 0 ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8"
            role="list"
            aria-label="Gallery images"
          >
            {galleryCards.map((card, index) => {
              const baseEffects = parseEffects(card.effect)
              const variantSequence = parseEffectVariants(card.effect_variants, baseEffects)

              return (
                <div
                  key={card.id}
                  data-animate="fade-scale"
                  data-animate-active="false"
                  style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${index * 100}ms` }}
                  role="listitem"
                >
                  <GalleryCard
                    defaultImage={card.default_image_url}
                    hoverImage={card.hover_image_url || undefined}
                    effect={baseEffects}
                    effectVariants={variantSequence}
                    alt={`Star Café ambience ${card.position}`}
                    caption={card.caption || `Ambience ${card.position}`}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-muted">No gallery images available at the moment.</p>
          </div>
        )}
        <div
          data-animate="fade-scale"
          data-animate-active="false"
          className="glow-surface glow-soft mt-8 sm:mt-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--accent)]/15 via-background to-background/60 p-6 sm:p-8 text-center shadow-lg backdrop-blur"
        >
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="/menu"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg font-semibold text-background shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.05] hover:shadow-xl min-h-[44px]"
              aria-label="Explore our menu"
            >
              Explore the Menu
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-[var(--accent)]/60 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg font-semibold text-[var(--accent)] shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.05] hover:border-[var(--accent)] hover:text-[var(--accent)]/90 min-h-[44px]"
              aria-label="Plan an event with us"
            >
              Plan an Event
            </a>
          </div>
        </div>
      </section>
    </m.main>
  )
})

AboutPage.displayName = 'AboutPage'

export default AboutPage
