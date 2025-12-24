import { useMemo, useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { createReservation } from '../lib/reservationService'
import { staggerContainer, fadeSlideUp } from './animations/menuAnimations'
import { logger } from '../utils/logger'

interface MenuReservationDrawerProps {
  open?: boolean
  onClose?: () => void
  cartCount?: number
}

const QUICK_TIMES = [
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '19:30', label: '7:30 PM' },
  { value: '20:00', label: '8:00 PM' },
]

const MenuReservationDrawer = ({
  open,
  onClose,
  cartCount = 0,
}: MenuReservationDrawerProps): JSX.Element => {
  const { user } = useAuth()
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // State declarations
  const [partySize, setPartySize] = useState(2)
  const [reservationDate, setReservationDate] = useState(today)
  const [reservationTime, setReservationTime] = useState(QUICK_TIMES[0]?.value || '18:00')
  const [preOrder, setPreOrder] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')

  // Watch for theme changes
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
  }, [open])

  // Sync email when user changes
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email)
    }
  }, [user?.email, email])

  const resetState = () => {
    setPartySize(2)
    setReservationDate(today)
    setReservationTime(QUICK_TIMES[0]?.value || '18:00')
    setPreOrder(false)
    setNote('')
    setName('')
    setEmail(user?.email || '')
    setPhone('')
  }

  const formatTime = (time: string): string => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    if (!hours || !minutes) return ''
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    // Validate required fields
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    setSubmitting(true)
    try {
      // Build special requests - include pre-order info if checked
      let specialRequests = note.trim() || null
      if (preOrder && cartCount > 0) {
        const preOrderNote = `Pre-order requested: ${cartCount} item(s) in cart.${note.trim() ? ` Additional notes: ${note.trim()}` : ''}`
        specialRequests = preOrderNote.trim()
      }

      // Create reservation using the same service as ReservationsPage
      const result = await createReservation({
        userId: user?.id || null,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        reservationDate: (reservationDate || today) as string,
        reservationTime: reservationTime || QUICK_TIMES[0]?.value || '18:00',
        partySize: parseInt(partySize.toString(), 10),
        specialRequests: specialRequests,
        occasion: null,
        tablePreference: null,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to create reservation')
        setSubmitting(false)
        return
      }

      // Success message matching ReservationsPage style
      const successMessage = `🎉 Table reserved for ${partySize} on ${reservationDate || today} at ${formatTime(reservationTime || QUICK_TIMES[0]?.value || '18:00')}.${preOrder && cartCount > 0 ? ' Your pre-order has been noted.' : ''}`
      toast.success(successMessage, { duration: 5000 })

      if (import.meta.env.DEV && result.reservationId) {
        logger.log('Reservation created:', result.reservationId)
      }

      resetState()
      onClose?.()
    } catch (err) {
      logger.error('Unexpected error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            className="fixed inset-0 z-40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={onClose}
          />
          <m.aside
            className="fixed inset-y-0 right-0 z-50 w-[420px] max-w-full shadow-2xl border-l border-theme flex flex-col"
            style={{
              backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
              overscrollBehavior: 'contain',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 42 }}
          >
            <m.div
              className="flex items-center justify-between border-b border-theme px-6 py-5 flex-shrink-0"
              variants={fadeSlideUp}
              initial="hidden"
              animate="visible"
              custom={0.1}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-main)]/60">
                  Reserve
                </p>
                <h2 className="text-xl font-semibold text-[var(--text-main)]">Table Request</h2>
              </div>
              <m.button
                type="button"
                onClick={onClose}
                className="rounded-full border border-theme p-2 text-[var(--text-main)]/70 hover:bg-white/10 transition"
                aria-label="Close reservation drawer"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </m.button>
            </m.div>

            <m.form
              onSubmit={handleSubmit}
              className="px-6 py-6 pb-8 space-y-6 overflow-y-auto flex-1 min-h-0"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              style={{
                overscrollBehavior: 'contain',
              }}
            >
              {/* Required Contact Information */}
              <m.label className="space-y-2 block" variants={fadeSlideUp}>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">
                  Full Name *
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-theme bg-theme-elevated px-3 py-2 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </m.label>

              <m.label className="space-y-2 block" variants={fadeSlideUp} custom={0.05}>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">
                  Email *
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-theme bg-theme-elevated px-3 py-2 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                  placeholder="your.email@example.com"
                  required
                />
              </m.label>

              <m.label className="space-y-2 block" variants={fadeSlideUp} custom={0.1}>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">
                  Phone *
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-theme bg-theme-elevated px-3 py-2 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                  placeholder="+880 1234-567890"
                  required
                />
              </m.label>

              <m.div className="grid grid-cols-2 gap-4" variants={fadeSlideUp}>
                <m.label className="space-y-2" variants={fadeSlideUp} custom={0.05}>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">
                    Party Size
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={partySize}
                    onChange={event =>
                      setPartySize(Math.max(1, Math.min(12, Number(event.target.value))))
                    }
                    className="w-full rounded-xl border border-theme bg-theme-elevated px-3 py-2 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                    required
                  />
                </m.label>

                <m.label className="space-y-2" variants={fadeSlideUp} custom={0.1}>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">
                    Date
                  </span>
                  <input
                    type="date"
                    min={today}
                    value={reservationDate}
                    onChange={event => setReservationDate(event.target.value)}
                    className="w-full rounded-xl border border-theme bg-theme-elevated px-3 py-2 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                    required
                  />
                </m.label>

                <m.label className="space-y-2 col-span-2" variants={fadeSlideUp} custom={0.15}>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">
                    Time
                  </span>
                  <m.div className="flex flex-wrap gap-2" variants={staggerContainer}>
                    {QUICK_TIMES.map((slot, index) => {
                      const isActive = reservationTime === slot.value
                      return (
                        <m.button
                          key={slot.value}
                          type="button"
                          onClick={() => setReservationTime(slot.value)}
                          className={`rounded-xl border px-3 py-2 text-sm transition ${
                            isActive
                              ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-main)] shadow-[0_12px_30px_-20px_rgba(197,157,95,0.7)]'
                              : 'border-theme bg-theme-elevated text-[var(--text-main)]/70 hover:border-[var(--accent)]/30 hover:text-[var(--text-main)]'
                          }`}
                          variants={fadeSlideUp}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          custom={index * 0.05}
                        >
                          {slot.label}
                        </m.button>
                      )
                    })}
                  </m.div>
                </m.label>
              </m.div>

              <m.label
                className="flex items-center gap-3 rounded-2xl border border-theme bg-theme-elevated px-4 py-3 text-sm text-[var(--text-main)]/80"
                variants={fadeSlideUp}
                custom={0.2}
              >
                <input
                  type="checkbox"
                  checked={preOrder}
                  onChange={event => setPreOrder(event.target.checked)}
                  className="h-5 w-5 rounded border-theme-medium bg-white/10 text-[var(--accent)] focus:ring-[var(--accent)]/40 transition-all"
                />
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text-main)]">Pre-load my cart</p>
                  <p className="text-xs text-[var(--text-main)]/60">
                    We&apos;ll stage your current selection before you arrive.
                  </p>
                </div>
              </m.label>

              <AnimatePresence>
                {preOrder && (
                  <m.div
                    className="space-y-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3"
                    variants={fadeSlideUp}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    custom={0.25}
                  >
                    <div className="flex items-center justify-between text-sm text-[#FDE68A]">
                      <span>Current cart</span>
                      <span>
                        {cartCount} item{cartCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-xs text-[#FDE68A]/80">
                      You can tweak dishes anytime before arrival. Checkout locks it in for the
                      kitchen.
                    </p>
                    <m.div variants={fadeSlideUp} custom={0.3}>
                      <Link
                        to="/checkout"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-theme-strong px-4 py-2 text-xs font-semibold transition hover:border-theme-medium"
                        style={{
                          backgroundColor: isLightTheme
                            ? 'rgba(255, 255, 255, 0.3)'
                            : 'rgba(5, 5, 9, 0.3)',
                          color: 'var(--text-main)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = isLightTheme
                            ? 'rgba(255, 255, 255, 0.4)'
                            : 'rgba(5, 5, 9, 0.4)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = isLightTheme
                            ? 'rgba(255, 255, 255, 0.3)'
                            : 'rgba(5, 5, 9, 0.3)'
                        }}
                        onClick={() => onClose?.()}
                      >
                        Review cart
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </m.div>
                  </m.div>
                )}
              </AnimatePresence>

              <m.label className="space-y-2 block" variants={fadeSlideUp} custom={0.3}>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">
                  Notes
                </span>
                <textarea
                  value={note}
                  onChange={event => setNote(event.target.value.slice(0, 240))}
                  rows={3}
                  placeholder="Add celebration details, seating requests, or dietary notes."
                  className="w-full rounded-2xl border border-theme bg-theme-elevated px-3 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 transition-all"
                />
                <span className="block text-right text-[10px] text-[var(--text-main)]/40">
                  {note.length}/240
                </span>
              </m.label>

              <m.button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[var(--accent)] py-3 text-sm font-semibold text-black transition hover:bg-[#d6b37b] disabled:cursor-not-allowed disabled:opacity-70"
                variants={fadeSlideUp}
                custom={0.35}
                whileHover={!submitting ? { scale: 1.02, y: -2 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <m.svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </m.svg>
                    Sending…
                  </span>
                ) : (
                  'Submit Request'
                )}
              </m.button>
            </m.form>
          </m.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default MenuReservationDrawer
