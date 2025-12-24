import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { ReservationSettings } from '../lib/reservationSettingsService'
import {
  getReservationSettings,
  generateTimeSlotsFromSettings,
  isDateBlocked,
  isDayOperating,
  getMinBookingDate,
  getMaxBookingDate,
} from '../lib/reservationSettingsService'
import { logger } from '../utils/logger'
import CustomDropdown from './ui/CustomDropdown'

/**
 * Reservation Form Data Interface
 */
export interface ReservationFormData {
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  requests?: string
  occasion?: string
  preference?: string
}

/**
 * Reservation Settings Interface (extends service type)
 */
interface LocalReservationSettings extends ReservationSettings {
  opening_time?: string
  closing_time?: string
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
 * Form Errors Interface
 */
interface FormErrors {
  name?: string
  email?: string
  phone?: string
  date?: string
  time?: string
  guests?: string
}

/**
 * Occasion Option Interface
 */
interface OccasionOption {
  value: string
  label: string
  icon: string
}

/**
 * Preference Option Interface
 */
interface PreferenceOption {
  value: string
  label: string
  icon: string
}

/**
 * Reservation Form Component Props
 */
export interface ReservationFormProps {
  /**
   * Callback when form is submitted
   */
  onSubmit?: (data: ReservationFormData) => Promise<void> | void
  /**
   * Whether the form is disabled
   */
  disabled?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Default reservation settings fallback
 */
const DEFAULT_SETTINGS: LocalReservationSettings = {
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
 * All possible occasions
 */
const ALL_OCCASIONS: OccasionOption[] = [
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'anniversary', label: 'Anniversary', icon: '💑' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'date', label: 'Date Night', icon: '🌹' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' },
  { value: 'casual', label: 'Casual', icon: '☕' },
]

/**
 * All possible preferences
 */
const ALL_PREFERENCES: PreferenceOption[] = [
  { value: 'window', label: 'Window Seat', icon: '🪟' },
  { value: 'quiet', label: 'Quiet Area', icon: '🤫' },
  { value: 'bar', label: 'Near Bar', icon: '🍷' },
  { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { value: 'any', label: 'No Preference', icon: '✨' },
]

/**
 * ReservationForm Component
 *
 * A comprehensive reservation form with real-time availability checking,
 * validation, and accessibility features. Supports admin-configurable
 * settings for hours, capacity, occasions, and preferences.
 *
 * @component
 * @param props - ReservationForm component props
 */
const ReservationForm: React.FC<ReservationFormProps> = ({
  onSubmit,
  disabled = false,
  className = '',
}) => {
  const { user } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  // Settings state
  const [settings, setSettings] = useState<LocalReservationSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true)

  // Form state
  const [formData, setFormData] = useState<ReservationFormData>({
    name: '',
    email: user?.email || '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    requests: '',
    occasion: '',
    preference: '',
  })

  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

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

  // Load reservation settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async (): Promise<void> => {
    setLoadingSettings(true)
    const result = await getReservationSettings()

    if (result.success && result.data) {
      setSettings(result.data as unknown as LocalReservationSettings)
    } else {
      logger.error('Failed to load settings:', result.error)
      // Use defaults if settings fail to load
      setSettings(DEFAULT_SETTINGS)
    }

    setLoadingSettings(false)
  }

  // Generate time slots based on settings
  const timeSlots = useMemo(() => {
    if (!settings) return []
    return generateTimeSlotsFromSettings(settings)
  }, [settings])

  // Filter based on admin settings
  const occasions = useMemo(() => {
    if (!settings) return ALL_OCCASIONS
    return ALL_OCCASIONS.filter(occ => settings.enabled_occasions.includes(occ.value))
  }, [settings])

  const preferences = useMemo(() => {
    if (!settings) return ALL_PREFERENCES
    return ALL_PREFERENCES.filter(pref => settings.enabled_preferences.includes(pref.value))
  }, [settings])

  const checkAvailability = useCallback(async (): Promise<void> => {
    if (!settings) return

    setCheckingAvailability(true)
    setIsAvailable(null)

    try {
      // Check if date is blocked
      const blockedDates = settings.blocked_dates || []
      if (isDateBlocked(formData.date, blockedDates)) {
        setIsAvailable(false)
        setCheckingAvailability(false)
        return
      }

      // Check if day is operating
      const dateObj = new Date(formData.date + 'T00:00:00')
      if (!isDayOperating(dateObj, settings.operating_days)) {
        setIsAvailable(false)
        setCheckingAvailability(false)
        return
      }

      // Query existing reservations for the selected date/time
      const { data: existingReservations, error } = await supabase
        .from('table_reservations')
        .select('party_size')
        .eq('reservation_date', formData.date)
        .eq('reservation_time', formData.time)
        .in('status', ['pending', 'confirmed'])

      if (error) {
        logger.error('Error checking availability:', error)
        setIsAvailable(true) // Default to available if check fails
        return
      }

      // Use max capacity from settings
      const maxCapacity = settings.max_capacity_per_slot || 50
      const totalGuests = (existingReservations || []).reduce(
        (sum: number, r: { party_size: number }) => sum + r.party_size,
        0
      )
      const available = totalGuests + formData.guests <= maxCapacity

      setIsAvailable(available)
    } catch (err) {
      logger.error('Availability check error:', err)
      setIsAvailable(true)
    } finally {
      setCheckingAvailability(false)
    }
  }, [settings, formData.date, formData.time, formData.guests])

  // Check availability when date/time/guests change
  useEffect(() => {
    if (formData.date && formData.time && formData.guests) {
      checkAvailability()
    }
  }, [formData.date, formData.time, formData.guests, checkAvailability])

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      const phoneRegex = /^[\d\s\-+()]{8,20}$/
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    // Time validation
    if (!formData.time) {
      newErrors.time = 'Time is required'
    }

    // Guests validation
    if (
      !formData.guests ||
      formData.guests < (settings?.min_party_size || 1) ||
      formData.guests > (settings?.max_party_size || 20)
    ) {
      newErrors.guests = `Party size must be between ${settings?.min_party_size || 1} and ${settings?.max_party_size || 20}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, settings])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault()
      if (!validate()) {
        return
      }

      if (onSubmit) {
        await onSubmit(formData)

        // Reset form
        setFormData({
          name: '',
          email: user?.email || '',
          phone: '',
          date: '',
          time: '',
          guests: 2,
          requests: '',
          occasion: '',
          preference: '',
        })
        setErrors({})
      }
    },
    [formData, validate, onSubmit, user?.email]
  )

  // Calculate min and max dates based on settings
  const getMinDate = useCallback((): string => {
    if (!settings) {
      const isoString = new Date().toISOString()
      const datePart = isoString.split('T')[0]
      return datePart ?? ''
    }
    const minDate = getMinBookingDate(settings.allow_same_day_booking)
    const isoString = minDate.toISOString()
    const datePart = isoString.split('T')[0]
    return datePart ?? ''
  }, [settings])

  const getMaxDate = useCallback((): string => {
    if (!settings) {
      const isoString = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      const datePart = isoString.split('T')[0]
      return datePart ?? ''
    }
    const maxDate = getMaxBookingDate(settings.advance_booking_days)
    const isoString = maxDate.toISOString()
    const datePart = isoString.split('T')[0]
    return datePart ?? ''
  }, [settings])

  // Show loading state while settings load
  if (loadingSettings) {
    return (
      <div
        className={`card-soft p-12 ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Loading reservation form"
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"
            style={{ animation: prefersReducedMotion ? 'none' : undefined }}
            aria-hidden="true"
          />
          <p className="text-sm text-muted">Loading reservation form...</p>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`space-y-5 ${className}`} noValidate>
      {/* Special Notice from Admin */}
      {settings?.special_notice && (
        <div
          className="rounded-xl p-3 mb-4"
          style={{
            backgroundColor: 'rgba(var(--color-amber-rgb), 0.1)',
            border: '1px solid rgba(var(--color-amber-rgb), 0.3)',
          }}
          role="alert"
          aria-live="polite"
        >
          <div className="flex gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--color-amber)' }}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs" style={{ color: 'var(--color-amber)' }}>
              {settings.special_notice}
            </p>
          </div>
        </div>
      )}

      {/* Compact Grid Layout - Date, Time, Party Size, Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Selection */}
        <div className="space-y-2">
          <label htmlFor="reservation-date" className="text-xs font-medium text-[var(--text-main)]">
            📅 Date *
          </label>
          <input
            id="reservation-date"
            type="date"
            value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })}
            required
            disabled={disabled}
            min={getMinDate()}
            max={getMaxDate()}
            className="input-base min-h-[44px]"
            aria-required="true"
            aria-invalid={errors.date ? 'true' : 'false'}
            aria-describedby={errors.date ? 'reservation-date-error' : undefined}
          />
          {errors.date && (
            <p
              id="reservation-date-error"
              className="text-xs mt-1"
              style={{ color: 'var(--destructive)' }}
              role="alert"
            >
              {errors.date}
            </p>
          )}
        </div>

        {/* Time Selection - Dropdown */}
        <div className="space-y-2">
          <label htmlFor="reservation-time" className="text-xs font-medium text-[var(--text-main)]">
            ⏰ Time *
          </label>
          <CustomDropdown
            id="reservation-time"
            options={[
              { value: '', label: 'Select time' },
              ...timeSlots.map((slot: string) => ({ value: slot, label: slot })),
            ]}
            value={formData.time || ''}
            onChange={e => setFormData({ ...formData, time: String(e.target.value) })}
            placeholder="Select time"
            disabled={disabled || !formData.date}
            required
            maxVisibleItems={5}
            aria-required="true"
            aria-invalid={errors.time ? 'true' : 'false'}
            aria-describedby={errors.time ? 'reservation-time-error' : undefined}
          />
          {errors.time && (
            <p
              id="reservation-time-error"
              className="text-xs mt-1"
              style={{ color: 'var(--destructive)' }}
              role="alert"
            >
              {errors.time}
            </p>
          )}
        </div>

        {/* Party Size */}
        <div className="space-y-2">
          <label
            htmlFor="reservation-guests"
            className="text-xs font-medium text-[var(--text-main)]"
          >
            👥 Party Size *
          </label>
          <input
            id="reservation-guests"
            type="number"
            value={formData.guests}
            onChange={e => {
              setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })
              if (errors.guests) setErrors({ ...errors, guests: undefined })
            }}
            min={settings?.min_party_size || 1}
            max={settings?.max_party_size || 20}
            required
            disabled={disabled}
            className={`input-base min-h-[44px]`}
            style={errors.guests ? { borderColor: 'var(--destructive)' } : undefined}
            placeholder="Number of guests"
            aria-required="true"
            aria-invalid={errors.guests ? 'true' : 'false'}
            aria-describedby={errors.guests ? 'reservation-guests-error' : undefined}
          />
          {errors.guests && (
            <p
              id="reservation-guests-error"
              className="text-xs mt-1"
              style={{ color: 'var(--destructive)' }}
              role="alert"
            >
              {errors.guests}
            </p>
          )}
        </div>

        {/* Availability Indicator - Compact */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">Status</label>
          {formData.date && formData.time && formData.guests ? (
            <div
              className="px-3 py-2.5 rounded-lg border text-xs flex items-center gap-2 min-h-[44px]"
              style={
                checkingAvailability
                  ? {
                      borderColor: 'rgba(var(--color-blue-rgb), 0.3)',
                      backgroundColor: 'rgba(var(--color-blue-rgb), 0.1)',
                      color: 'var(--color-blue)',
                    }
                  : isAvailable
                    ? {
                        borderColor: 'rgba(var(--color-emerald-rgb), 0.3)',
                        backgroundColor: 'rgba(var(--color-emerald-rgb), 0.1)',
                        color: 'var(--color-emerald)',
                      }
                    : {
                        borderColor: 'rgba(var(--color-orange-rgb), 0.3)',
                        backgroundColor: 'rgba(var(--color-orange-rgb), 0.1)',
                        color: 'var(--color-orange)',
                      }
              }
              role="status"
              aria-live="polite"
            >
              {checkingAvailability ? (
                <>
                  <div
                    className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                    style={{
                      borderColor: 'var(--color-blue)',
                      animation: prefersReducedMotion ? 'none' : undefined,
                    }}
                    aria-hidden="true"
                  />
                  <span>Checking...</span>
                </>
              ) : isAvailable ? (
                <>
                  <svg
                    className="w-3 h-3"
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
                  <span>Available</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3"
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
                  <span>Limited</span>
                </>
              )}
            </div>
          ) : (
            <div className="px-3 py-2.5 rounded-lg border border-theme bg-elevated text-xs text-muted min-h-[44px]">
              Select date & time
            </div>
          )}
        </div>
      </div>

      {/* Contact Information - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-theme">
        <div className="space-y-2">
          <label htmlFor="reservation-name" className="text-xs font-medium text-[var(--text-main)]">
            Full Name *
          </label>
          <input
            id="reservation-name"
            type="text"
            value={formData.name}
            onChange={e => {
              setFormData({ ...formData, name: e.target.value })
              if (errors.name) setErrors({ ...errors, name: undefined })
            }}
            required
            disabled={disabled}
            className={`input-base min-h-[44px]`}
            style={errors.name ? { borderColor: 'var(--destructive)' } : undefined}
            placeholder="Your name"
            aria-required="true"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'reservation-name-error' : undefined}
          />
          {errors.name && (
            <p
              id="reservation-name-error"
              className="text-xs mt-1"
              style={{ color: 'var(--destructive)' }}
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="reservation-email"
            className="text-xs font-medium text-[var(--text-main)]"
          >
            Email *
          </label>
          <input
            id="reservation-email"
            type="email"
            value={formData.email}
            onChange={e => {
              setFormData({ ...formData, email: e.target.value })
              if (errors.email) setErrors({ ...errors, email: undefined })
            }}
            required
            disabled={disabled}
            className={`input-base min-h-[44px]`}
            style={errors.email ? { borderColor: 'var(--destructive)' } : undefined}
            placeholder="you@email.com"
            aria-required="true"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'reservation-email-error' : undefined}
          />
          {errors.email && (
            <p
              id="reservation-email-error"
              className="text-xs mt-1"
              style={{ color: 'var(--destructive)' }}
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="reservation-phone"
            className="text-xs font-medium text-[var(--text-main)]"
          >
            Phone *
          </label>
          <input
            id="reservation-phone"
            type="tel"
            value={formData.phone}
            onChange={e => {
              setFormData({ ...formData, phone: e.target.value })
              if (errors.phone) setErrors({ ...errors, phone: undefined })
            }}
            required
            disabled={disabled}
            className={`input-base min-h-[44px]`}
            style={errors.phone ? { borderColor: 'var(--destructive)' } : undefined}
            placeholder="01XXXXXXXXX"
            aria-required="true"
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? 'reservation-phone-error' : undefined}
          />
          {errors.phone && (
            <p
              id="reservation-phone-error"
              className="text-xs mt-1"
              style={{ color: 'var(--destructive)' }}
              role="alert"
            >
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Optional Fields - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-theme">
        {/* Occasion - Dropdown */}
        <div className="space-y-2">
          <label
            htmlFor="reservation-occasion"
            className="text-xs font-medium text-[var(--text-main)]"
          >
            Occasion (Optional)
          </label>
          <CustomDropdown
            id="reservation-occasion"
            options={[
              { value: '', label: 'None' },
              ...occasions.map(occ => ({ value: occ.value, label: `${occ.icon} ${occ.label}` })),
            ]}
            value={formData.occasion || ''}
            onChange={e => {
              const value = String(e.target.value)
              setFormData({ ...formData, occasion: value || undefined })
            }}
            placeholder="None"
            disabled={disabled}
            maxVisibleItems={5}
          />
        </div>

        {/* Table Preference - Dropdown */}
        <div className="space-y-2">
          <label
            htmlFor="reservation-preference"
            className="text-xs font-medium text-[var(--text-main)]"
          >
            Table Preference (Optional)
          </label>
          <CustomDropdown
            id="reservation-preference"
            options={[
              { value: '', label: 'No preference' },
              ...preferences.map(pref => ({
                value: pref.value,
                label: `${pref.icon} ${pref.label}`,
              })),
            ]}
            value={formData.preference || ''}
            onChange={e => {
              const value = String(e.target.value)
              setFormData({ ...formData, preference: value || undefined })
            }}
            placeholder="No preference"
            disabled={disabled}
            maxVisibleItems={5}
          />
        </div>
      </div>

      {/* Special Requests - Compact */}
      <div className="space-y-2 pt-2 border-t border-theme">
        <label
          htmlFor="reservation-requests"
          className="text-xs font-medium text-[var(--text-main)]"
        >
          Special Requests (Optional)
        </label>
        <textarea
          id="reservation-requests"
          value={formData.requests || ''}
          onChange={e => setFormData({ ...formData, requests: e.target.value })}
          rows={2}
          disabled={disabled}
          className="input-base resize-none min-h-[44px]"
          placeholder="Dietary requirements, allergies, or special requests..."
          aria-describedby="reservation-requests-help"
        />
        <p id="reservation-requests-help" className="text-xs text-[var(--text-secondary)]">
          Dietary requirements, allergies, or special requests...
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-theme">
        <button
          type="submit"
          disabled={
            !formData.date ||
            !formData.time ||
            !formData.guests ||
            !formData.name ||
            !formData.email ||
            !formData.phone ||
            disabled
          }
          className="w-full btn-primary py-3 min-h-[44px] text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          aria-label="Confirm reservation"
        >
          {disabled ? (
            <>
              <div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                style={{ animation: prefersReducedMotion ? 'none' : undefined }}
                aria-hidden="true"
              />
              Booking...
            </>
          ) : (
            <>✓ Confirm Reservation</>
          )}
        </button>
      </div>
    </form>
  )
}

export default ReservationForm
