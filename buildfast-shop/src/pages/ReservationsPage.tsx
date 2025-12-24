import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { m, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useTheme } from '../contexts/ThemeContext'
import toast from 'react-hot-toast'
import { createReservation } from '../lib/reservationService'
import ConciergeBookingModal from '../components/ConciergeBookingModal'
import { getReservationSettings } from '../lib/reservationSettingsService'
import { getBackgroundStyle } from '../utils/backgroundUtils'
import { pageFade } from '../components/animations/menuAnimations'
import { logger } from '../utils/logger'

/**
 * Reservation Settings Interface
 */
interface ReservationSettings {
  opening_time: string
  closing_time: string
  time_slot_interval: number
  max_capacity_per_slot: number
  max_party_size: number
  min_party_size: number
  operating_days: number[]
  allow_same_day_booking: boolean
  advance_booking_days: number
  enabled_occasions: string[]
  enabled_preferences: string[]
  blocked_dates: string[]
  special_notice: string | null
}

/**
 * Reservation Form Data Interface
 */
interface ReservationFormData {
  name: string
  email?: string
  phone: string
  date: string
  time: string
  guests: string
  requests?: string
  occasion?: string
  preference?: string
}

/**
 * Default reservation settings fallback
 */
const DEFAULT_SETTINGS: ReservationSettings = {
  opening_time: '11:00:00',
  closing_time: '23:00:00',
  time_slot_interval: 30,
  max_capacity_per_slot: 50,
  max_party_size: 20,
  min_party_size: 1,
  operating_days: [0, 1, 2, 3, 4, 5, 6],
  allow_same_day_booking: true,
  advance_booking_days: 30,
  enabled_occasions: ['birthday', 'anniversary', 'business', 'date', 'celebration', 'casual'],
  enabled_preferences: ['window', 'quiet', 'bar', 'outdoor', 'any'],
  blocked_dates: [],
  special_notice: null,
}

/**
 * ReservationsPage Component
 *
 * Main page for table reservations with full booking functionality.
 * Features include reservation form, settings display, policies, and FAQs.
 *
 * @remarks
 * - Fully accessible with ARIA attributes
 * - Mobile-first responsive design
 * - WCAG 2.1 AA compliant
 * - Supports reduced motion preferences
 * - Uses design system CSS variables
 */
const ReservationsPage = memo(() => {
  const { user } = useAuth()
  const { settings, loading: settingsLoading } = useStoreSettings()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [reservationSettings, setReservationSettings] = useState<ReservationSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [_submitting, setSubmitting] = useState(false)

  // Feature flags - default to false during loading
  const enableReservations = useMemo(
    () => (settingsLoading ? false : (settings?.enable_reservations ?? true)),
    [settingsLoading, settings?.enable_reservations]
  )

  // Theme detection with reduced motion support
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  // Mobile detection for background attachment
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })

  // Theme observer
  useEffect(() => {
    if (typeof document === 'undefined') return

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  // Reduced motion observer
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)

    setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Mobile detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      setLoadingSettings(true)
      const result = await getReservationSettings()

      if (result.success && result.data) {
        setReservationSettings(result.data)
      } else {
        logger.warn('Reservation settings not found, using defaults')
        setReservationSettings(DEFAULT_SETTINGS)
      }
    } catch (err) {
      logger.error('Error loading reservation settings:', err)
      setReservationSettings(DEFAULT_SETTINGS)
      toast.error('Failed to load reservation settings. Using defaults.')
    } finally {
      setLoadingSettings(false)
    }
  }, [])

  useEffect(() => {
    if (settings && !enableReservations) {
      toast.error('Reservations are currently disabled.')
      navigate('/')
    }
  }, [enableReservations, navigate, settings])

  // Format time helper
  const formatTime = useCallback((time: string | null | undefined): string => {
    if (!time) return ''
    const parts = time.split(':')
    const hours = parts[0] || '0'
    const minutes = parts[1] || '00'
    const hour = parseInt(hours, 10)
    if (isNaN(hour)) return ''
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }, [])

  // Get operating days string
  const getOperatingDaysString = useCallback((): string => {
    if (!reservationSettings) return 'Every day'
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const operating = reservationSettings.operating_days || [0, 1, 2, 3, 4, 5, 6]

    if (operating.length === 7) return 'Every day'
    if (operating.length === 0) return 'Closed'

    const weekdays = [1, 2, 3, 4, 5]
    const isWeekdaysOnly = weekdays.every(d => operating.includes(d)) && operating.length === 5
    if (isWeekdaysOnly) return 'Monday - Friday'

    const weekends = [0, 6]
    const isWeekendsOnly = weekends.every(d => operating.includes(d)) && operating.length === 2
    if (isWeekendsOnly) return 'Weekends only'

    return operating.map(d => days[d]).join(', ')
  }, [reservationSettings])

  // Handle reservation submission
  const _handleReservationSubmit = useCallback(
    async (data: unknown) => {
      setSubmitting(true)

      try {
        const formData = data as ReservationFormData
        const result = await createReservation({
          userId: user?.id || null,
          customerName: formData.name,
          customerEmail: formData.email || user?.email || '',
          customerPhone: formData.phone,
          reservationDate: formData.date,
          reservationTime: formData.time,
          partySize: parseInt(formData.guests, 10),
          specialRequests: formData.requests || null,
          occasion: formData.occasion || null,
          tablePreference: formData.preference || null,
        })

        if (!result.success) {
          toast.error(result.error)
          return
        }

        toast.success(
          `🎉 Table reserved for ${formData.guests} on ${formData.date} at ${formatTime(formData.time || '')}.`,
          { duration: 5000 }
        )

        logger.log('Reservation created:', result.reservationId)

        setShowInfoModal(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (err) {
        logger.error('Unexpected error:', err)
        toast.error('An unexpected error occurred. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
    [user, formatTime]
  )

  // Animation variants with reduced motion support
  const animationVariants: Variants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }
    }
    return pageFade
  }, [prefersReducedMotion])

  // Get theme-aware background style (must be before early returns)
  const section = `reservation_${theme}`
  const backgroundStyle = useMemo(
    () => (settings ? getBackgroundStyle(settings, section) : {}),
    [settings, section]
  )

  // Hero overlay style (must be before early returns)
  const heroOverlayStyle = useMemo(() => {
    const isImageBackground = backgroundStyle.backgroundImage
    return isImageBackground
      ? {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), ${backgroundStyle.backgroundImage}`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: isMobile ? 'scroll' : 'fixed',
        }
      : backgroundStyle
  }, [backgroundStyle, isMobile])

  // Loading state
  if (loadingSettings) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading reservation system"
      >
        <div className="text-center space-y-3">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto"
            aria-hidden="true"
          />
          <p className="text-[var(--text-secondary)] text-sm">Loading reservation system...</p>
        </div>
      </div>
    )
  }

  // Disabled state
  if (!enableReservations) {
    return (
      <m.main
        className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]"
        variants={animationVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
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
        aria-label="Reservations unavailable"
      >
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-4">
            Reservations Unavailable
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            Reservations are currently disabled.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 min-h-[44px] rounded-lg bg-[var(--accent)] text-black font-semibold hover:bg-[var(--accent)]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="Go to home page"
          >
            Go to Home
          </button>
        </div>
      </m.main>
    )
  }

  return (
    <m.main
      className="reservations-page-bg min-h-screen space-y-0 bg-cover bg-center bg-scroll md:bg-fixed"
      style={{
        ...backgroundStyle,
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible',
      }}
      variants={animationVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="main"
      aria-label="Reservations page"
    >
      {/* Hero Section */}
      <div
        className="relative h-[60vh] md:h-[70vh] bg-cover bg-center bg-fixed"
        style={{
          ...heroOverlayStyle,
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate',
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            transform: 'none',
            willChange: 'auto',
          }}
        >
          <div
            className="text-center text-[var(--text-main)] px-4 max-w-4xl mx-auto"
            style={{
              position: 'relative',
              top: 'auto',
              left: 'auto',
              right: 'auto',
              bottom: 'auto',
              transform: 'none',
              margin: '0 auto',
              width: '100%',
              maxWidth: '56rem',
            }}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full backdrop-blur-md border border-[var(--border-default)] px-5 py-2.5 mb-6 min-h-[44px]"
              style={{
                backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)',
                borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'var(--border-default)',
              }}
              role="status"
              aria-label="Reservations badge"
            >
              <svg
                className="w-5 h-5 text-[var(--accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider">Reservations</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 tracking-tight">
              Reserve Your Table
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-main)] font-light leading-relaxed mb-8">
              Experience exceptional dining at Star Café
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="px-10 py-3 min-h-[44px] rounded-full bg-gradient-to-r from-[var(--accent)]/90 via-[var(--color-amber)]/80 to-[var(--color-orange)]/80 text-neutral-900 text-base font-semibold uppercase tracking-wide shadow-[0_18px_38px_-18px_rgba(var(--accent-rgb),0.55)] hover:translate-y-[-1px] hover:shadow-[0_22px_44px_-20px_rgba(var(--accent-rgb),0.6)] transition-all inline-flex items-center gap-2 border border-[var(--border-default)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]"
                aria-label="Open reservation form"
                aria-expanded={showInfoModal}
                aria-controls="reservation-modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Reserve Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Special Notice */}
      {reservationSettings?.special_notice && (
        <div
          className="bg-gradient-to-r from-[var(--color-amber)] to-[var(--color-orange)] text-black"
          role="alert"
          aria-live="polite"
        >
          <div className="app-container py-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm md:text-base font-medium">
                {reservationSettings.special_notice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards Section */}
      <section
        className="py-16 bg-gradient-to-b from-transparent to-[var(--bg-elevated)]"
        aria-labelledby="reservation-info-heading"
      >
        <div className="app-container">
          <h2 id="reservation-info-heading" className="sr-only">
            Reservation Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {/* Opening Hours Card */}
            <div className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 hover:border-[var(--accent)]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent)]/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/10 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-[var(--accent)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">
                  Opening Hours
                </h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--accent)] mb-1">
                  {formatTime(reservationSettings?.opening_time || null)} -{' '}
                  {formatTime(reservationSettings?.closing_time || null)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">{getOperatingDaysString()}</p>
              </div>
            </div>

            {/* Instant Booking Card */}
            <div className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 hover:border-[var(--color-emerald)]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-emerald)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-emerald)]/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-emerald)]/20 to-[var(--color-emerald)]/10 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-[var(--color-emerald)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">
                  Instant Booking
                </h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-emerald)] mb-1">
                  30 min
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Confirmation via SMS/Call</p>
              </div>
            </div>

            {/* Group Size Card */}
            <div className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 hover:border-[var(--color-blue)]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-blue)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-blue)]/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-blue)]/20 to-[var(--color-blue)]/10 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-[var(--color-blue)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">
                  Group Size
                </h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-blue)] mb-1">
                  {reservationSettings?.min_party_size || 1} -{' '}
                  {reservationSettings?.max_party_size || 20}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Guests per reservation</p>
              </div>
            </div>

            {/* Book Ahead Card */}
            <div className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-default)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 hover:border-[var(--color-purple)]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-purple)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-purple)]/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-purple)]/20 to-[var(--color-purple)]/10 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-[var(--color-purple)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">
                  Book Ahead
                </h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--color-purple)] mb-1">
                  {reservationSettings?.advance_booking_days || 30} days
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {reservationSettings?.allow_same_day_booking
                    ? 'Same-day available'
                    : 'Book 1 day ahead'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies Section */}
      <section className="pt-16 pb-0 bg-transparent" aria-labelledby="policies-heading">
        <div className="app-container">
          <div className="text-center mb-12">
            <h2
              id="policies-heading"
              className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-4"
            >
              Reservation Policies
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Everything you need to know before booking
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {/* Easy Booking */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-green)]/20 to-[var(--color-green)]/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--color-green)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)] mb-3">
                Easy Booking
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Book online 24/7.{' '}
                {reservationSettings?.allow_same_day_booking
                  ? 'Same-day reservations accepted'
                  : 'Book at least 1 day in advance'}
                . Reserve up to {reservationSettings?.advance_booking_days || 30} days ahead.
              </p>
            </div>

            {/* Free Cancellation */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-yellow)]/20 to-[var(--color-yellow)]/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--color-yellow)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)] mb-3">
                Free Cancellation
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Cancel or modify your reservation up to 2 hours before your booking time without any
                charges.
              </p>
            </div>

            {/* Large Groups */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-red)]/20 to-[var(--color-red)]/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--color-red)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)] mb-3">
                Large Groups
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                For parties larger than {reservationSettings?.max_party_size || 20} guests or
                special events, please call us at{' '}
                <a href="tel:01726-367742" className="text-[var(--accent)] hover:underline">
                  01726-367742
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Reserve Early Section */}
      <section
        className="py-16 border-y border-[var(--border-subtle)]"
        aria-labelledby="why-reserve-heading"
      >
        <div className="app-container">
          <div
            className="relative overflow-hidden rounded-[32px] border border-[var(--border-default)] bg-[var(--bg-main)]/50 px-6 py-12 backdrop-blur-xl md:px-12"
            style={{
              background: `linear-gradient(150deg, rgba(var(--bg-main-rgb), 0.92), rgba(var(--bg-main-rgb), 0.85))`,
              boxShadow: isLightTheme
                ? '0 40px 120px -45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                : '0 40px 120px -45px rgba(0, 0, 0, 0.75)',
              borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'var(--border-default)',
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.14),rgba(15,17,23,0.2))]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_62%)] opacity-70" />
            <div className="pointer-events-none absolute -top-32 -right-24 h-64 w-64 rounded-full bg-[var(--accent)]/12 blur-3xl" />
            <div className="relative space-y-12">
              <div className="text-center space-y-4">
                <h2
                  id="why-reserve-heading"
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)]"
                >
                  Why Guests Reserve Early
                </h2>
                <p className="text-sm text-[var(--text-main)]/80 max-w-3xl mx-auto">
                  Weekend services routinely fill 48 hours ahead. Locking in your reservation
                  secures preferred seating, celebration add-ons, and concierge follow-up before the
                  dining room reaches capacity.
                </p>
              </div>

              <div className="relative grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: 'Preferred Seating Guaranteed',
                    description:
                      'Choose window banquettes, lounge pods, or chef counter seats. Our host assigns your request the moment the booking lands.',
                    stat: '92% fulfilled',
                    accentColor: 'var(--color-emerald)',
                  },
                  {
                    title: 'Signature Welcome Bite',
                    description:
                      'Reserved tables receive a complimentary amuse-bouche of smoked aubergine pâté with toasted focaccia plated minutes before arrival.',
                    stat: "Chef's courtesy",
                    accentColor: 'var(--color-amber)',
                  },
                  {
                    title: 'Celebration Concierge',
                    description:
                      'Mention birthdays or anniversaries and we stage sparklers, playlists, and handwritten host cards on cue.',
                    stat: 'Available daily',
                    accentColor: 'var(--color-rose)',
                  },
                ].map(item => (
                  <div
                    key={item.title}
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-main)]/45 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur-lg"
                    style={{
                      boxShadow: isLightTheme
                        ? '0 32px 120px -50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                        : '0 32px 120px -50px rgba(0, 0, 0, 0.9)',
                      borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'var(--border-strong)',
                    }}
                  >
                    <div
                      className="absolute -top-24 -right-12 h-36 w-36 rounded-full blur-3xl opacity-70"
                      style={{ backgroundColor: `${item.accentColor}/15` }}
                    />
                    <div className="relative space-y-4">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-main)]/80 min-h-[44px]"
                        style={{
                          backgroundColor: isLightTheme
                            ? 'rgba(0, 0, 0, 0.08)'
                            : 'rgba(255, 255, 255, 0.1)',
                          borderColor: isLightTheme
                            ? 'rgba(0, 0, 0, 0.15)'
                            : 'var(--border-default)',
                        }}
                      >
                        {item.stat}
                      </span>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[var(--text-main)]/80 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section
        className="py-16"
        style={{
          backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
        }}
        aria-labelledby="faqs-heading"
      >
        <div className="app-container space-y-10">
          <div className="text-center space-y-3">
            <h2
              id="faqs-heading"
              className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)]"
            >
              Reservation FAQs
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto">
              Sourced from our concierge playbook and the most frequent guest emails answered in
              2025.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
            {[
              {
                question: 'How early should I arrive?',
                answer:
                  'Arrive five minutes before your slot. We hold tables for 15 minutes; after that, the reservation may be reassigned during peak service.',
              },
              {
                question: 'Can I modify my guest count?',
                answer:
                  'Yes. Use the confirmation email link or call +880 1726-367742 at least two hours prior so the floor team can adjust seating charts.',
              },
              {
                question: 'Do you accommodate dietary needs?',
                answer:
                  'Absolutely. Note vegetarian, vegan, gluten-free, halal, or allergy requirements in the request field and our kitchen prepares alternatives.',
              },
              {
                question: 'Is there a deposit?',
                answer:
                  'No deposit is required for parties under 12. Larger celebrations secure a refundable BDT 5,000 advance that applies to the final bill.',
              },
            ].map(item => (
              <div
                key={item.question}
                className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-left space-y-3"
              >
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)]">
                  {item.question}
                </h3>
                <p className="text-sm text-[var(--text-main)]/80 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reservation Modal */}
      <ConciergeBookingModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </m.main>
  )
})

ReservationsPage.displayName = 'ReservationsPage'

export default ReservationsPage
