import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { m } from 'framer-motion'
import ConciergeBookingModal from '../components/ConciergeBookingModal'
import SectionTitle from '../components/SectionTitle'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { pageFade } from '../components/animations/menuAnimations'

/**
 * Interface for action item structure
 */
interface ActionItem {
  label: string
  title: string
  description: string
  action: string
  link?: {
    href: string
    target?: string
    rel?: string
  }
  modal?: boolean
}

const ACTION_ITEMS: ActionItem[] = [
  {
    label: 'Concierge Line',
    title: '+880 1726-367742',
    description: 'Direct host assistance · Immediate seating checks',
    action: 'Call',
    link: {
      href: 'tel:+8801726367742',
    },
  },
  {
    label: 'WhatsApp Desk',
    title: 'Chat With Our Team',
    description: 'Live confirmations · Attach menus & event briefs',
    action: 'Chat',
    link: {
      href: 'https://wa.me/8801726367742',
      target: '_blank',
      rel: 'noreferrer',
    },
  },
  {
    label: 'Concierge Request',
    title: 'Plan An Experience',
    description: 'Reply within 12 hours · Tailored menus & proposals',
    action: 'Start',
    modal: true,
  },
]

/**
 * Contact Page Component
 *
 * Displays contact information, booking hours, and location map.
 * Provides multiple ways to reach the Star Café team.
 *
 * @component
 */
const ContactPage = memo((): JSX.Element => {
  const { settings, loading: settingsLoading } = useStoreSettings()
  // Theme detection (currently unused but kept for future use)
  // const _isLightTheme = useTheme()
  const enableReservations = useMemo(() => {
    return settingsLoading ? false : (settings?.enable_reservations ?? true)
  }, [settingsLoading, settings?.enable_reservations])
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false)
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

  const handleConciergeAction = useCallback(
    (modal: boolean): void => {
      if (modal && enableReservations) {
        setIsBookingOpen(true)
      }
    },
    [enableReservations]
  )

  const filteredActionItems = useMemo(() => {
    return ACTION_ITEMS.filter(item => !item.modal || enableReservations)
  }, [enableReservations])

  return (
    <m.main
      className="space-y-16"
      data-animate="fade-scale"
      data-animate-active="false"
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
      aria-label="Contact page"
    >
      <SectionTitle
        eyebrow="Contact"
        title="Reach The Star Café Team"
        subtitle="Connect with us instantly for reservations, catering, or partnership inquiries."
        align="center"
      />

      <div
        className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        data-animate="fade-scale"
        data-animate-active="false"
        role="list"
        aria-label="Contact options"
      >
        {filteredActionItems.map(({ label, title, description, action, link, modal }, index) => (
          <article
            key={label}
            data-animate="fade-rise"
            data-animate-active="false"
            style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${index * 120}ms` }}
            className="group glow-surface glow-soft flex h-full flex-col justify-between gap-6 rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 transition hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)] sm:flex-row sm:items-center sm:gap-8"
            role="listitem"
          >
            <div className="flex flex-col gap-1.5 text-left">
              <p className="text-sm sm:text-xs uppercase tracking-[0.28em] text-[var(--accent)]/80">
                {label}
              </p>
              <h3
                className="text-xl sm:text-2xl md:text-3xl font-semibold"
                style={{ color: 'var(--text-main)' }}
              >
                {title}
              </h3>
              <p className="text-sm sm:text-xs text-muted">{description}</p>
            </div>
            {modal ? (
              <button
                type="button"
                onClick={() => handleConciergeAction(modal)}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-6 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] cursor-pointer"
                aria-label={`${action} - ${title}`}
              >
                {action}
              </button>
            ) : (
              <a
                {...link}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-6 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label={`${action} - ${title}`}
              >
                {action}
              </a>
            )}
          </article>
        ))}
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        <section
          className="card-soft glow-soft flex h-full flex-col justify-between rounded-xl sm:rounded-2xl border border-theme-subtle bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
          data-animate="drift-left"
          data-animate-active="false"
          aria-labelledby="booking-hours-heading"
        >
          <div className="space-y-5">
            <span
              className="inline-flex w-max items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-sm sm:text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]"
              role="status"
              aria-label="Concierge response time less than 12 hours"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
              Concierge Response &lt; 12h
            </span>
            <h3
              id="booking-hours-heading"
              className="text-xl sm:text-2xl md:text-3xl font-semibold"
              style={{ color: 'var(--text-main)' }}
            >
              Booking Desk Hours
            </h3>
            <ul
              className="space-y-3 text-sm sm:text-xs text-muted"
              role="list"
              aria-label="Service hours"
            >
              <li
                className="flex items-center justify-between gap-4 rounded-xl border border-theme-subtle bg-white/[0.03] px-4 sm:px-6 md:px-10 py-3"
                role="listitem"
              >
                <span>Reservations & Dining</span>
                <span className="text-[var(--accent)]">10:00 – 24:00 BST</span>
              </li>
              <li
                className="flex items-center justify-between gap-4 rounded-xl border border-theme-subtle bg-white/[0.03] px-4 sm:px-6 md:px-10 py-3"
                role="listitem"
              >
                <span>Private Events & Catering</span>
                <span className="text-[var(--accent)]">09:00 – 20:00 BST</span>
              </li>
              <li
                className="flex items-center justify-between gap-4 rounded-xl border border-theme-subtle bg-white/[0.03] px-4 sm:px-6 md:px-10 py-3"
                role="listitem"
              >
                <span>Partnership & Media</span>
                <span className="text-[var(--accent)]">24h Email Support</span>
              </li>
            </ul>
          </div>
          <p className="mt-6 text-sm sm:text-xs text-muted">
            Tell us your ideal date, guest count, and any special touches—we&apos;ll confirm
            availability and tailored options in your preferred channel.
          </p>
        </section>

        <section
          className="card-soft glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl border border-theme-subtle bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
          data-animate="drift-right"
          data-animate-active="false"
          aria-labelledby="guest-praise-heading"
        >
          <div
            className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[var(--accent)]/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div className="space-y-4">
              <p
                id="guest-praise-heading"
                className="text-sm sm:text-xs uppercase tracking-[0.28em] text-muted"
              >
                Guest Praise
              </p>
              <blockquote className="space-y-4">
                <p
                  className="text-xl sm:text-2xl md:text-3xl font-semibold leading-tight"
                  style={{ color: 'var(--text-main)' }}
                >
                  &quot;The Star Café team confirmed our corporate dinner in under an hour and
                  curated a bespoke tasting menu that wowed every guest.&quot;
                </p>
                <footer className="flex flex-col text-sm sm:text-xs text-muted">
                  <span className="font-medium text-[var(--accent)]">
                    Amina Rahman · Event Strategist
                  </span>
                  <span>Five-star Google review · October 2025</span>
                </footer>
              </blockquote>
            </div>
            <div className="flex items-center gap-3" role="group" aria-label="Rating information">
              <div
                className="flex items-center gap-1.5 text-[var(--accent)]"
                aria-label="5 stars"
                aria-hidden="true"
              >
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <p className="text-sm sm:text-xs text-muted">
                4.9 average rating across Google & Facebook partners
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="space-y-14" aria-labelledby="contact-info-heading">
        <div data-animate="fade-rise" data-animate-active="false"></div>

        <div
          className="card-soft overflow-hidden rounded-3xl border border-theme-subtle bg-theme-elevated"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="relative h-96 overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/18 via-transparent to-transparent"
              aria-hidden="true"
            />
            <iframe
              title="Star Café at Chitrar Mor"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.6049309340977!2d89.2017357154667!3d23.79587568439361!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fead1e7cf4e0f5%3A0x8f5b6d12143b580d!2sStar%20Caf%C3%A9!5e0!3m2!1sen!2sbd!4v1731244800000!5m2!1sen!2sbd"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              aria-label="Map showing Star Café location at Chitrar Mor"
            />
          </div>
          <div className="flex flex-col gap-5 border-t border-theme-subtle px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md space-y-2">
              <h4
                className="text-xl sm:text-2xl md:text-3xl font-semibold"
                style={{ color: 'var(--text-main)' }}
              >
                Visit Our Café
              </h4>
              <p className="text-sm sm:text-xs text-muted">
                Shuvash Chandra Road, moments from Chitrar Mor Plaza. Dedicated valet-ready entrance
                with evening lighting for effortless arrivals.
              </p>
            </div>
            <a
              className="btn-outline inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap text-sm"
              href="https://www.google.com/maps/dir/?api=1&destination=Chitrar+Mor%2C+Jashore%2C+Bangladesh"
              target="_blank"
              rel="noreferrer"
              aria-label="Open Star Café location in Google Maps"
            >
              Open In Google Maps
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M5 15 14 6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m6 5 9 0 0 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>
      {enableReservations && (
        <ConciergeBookingModal open={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      )}
    </m.main>
  )
})

ContactPage.displayName = 'ContactPage'

export default ContactPage
