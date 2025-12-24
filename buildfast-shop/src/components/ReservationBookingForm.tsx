import { useState, useMemo, useEffect, FormEvent, ChangeEvent } from 'react'
import { logger } from '../utils/logger'

interface RoomOption {
  value: string
  label: string
  description: string
}

interface ReservationFormData {
  fullName: string
  email: string
  phone: string
  checkInDate: string
  checkInTime: string
  checkOutDate: string
  guests: number
  roomType: string
  requests: string
}

interface ReservationBookingFormProps {
  onSubmit: (data: ReservationFormData) => Promise<void>
  disabled?: boolean
  minGuests?: number
  maxGuests?: number
  propertyName?: string
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  checkInDate?: string
  checkOutDate?: string
  checkInTime?: string
  guests?: string
  roomType?: string
  submit?: string
  [key: string]: string | undefined
}

const roomOptions: RoomOption[] = [
  {
    value: 'standard',
    label: 'Standard Room',
    description: 'Queen bed - Cozy interior - Perfect for quick stays',
  },
  {
    value: 'deluxe',
    label: 'Deluxe Room',
    description: 'King bed - City view - Lounge access included',
  },
  {
    value: 'suite',
    label: 'Executive Suite',
    description: 'Separate living area - Premium minibar - Butler service',
  },
]

const ReservationBookingForm = ({
  onSubmit,
  disabled = false,
  minGuests = 1,
  maxGuests = 6,
  propertyName = 'Star Cafe Residences',
}: ReservationBookingFormProps): JSX.Element => {
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const [formData, setFormData] = useState<ReservationFormData>({
    fullName: '',
    email: '',
    phone: '',
    checkInDate: '',
    checkInTime: '15:00',
    checkOutDate: '',
    guests: minGuests,
    roomType:
      roomOptions.length > 0 && roomOptions[0] ? (roomOptions[0]?.value ?? 'standard') : 'standard',
    requests: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

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

  const updateField = (name: keyof ReservationFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }

  const validate = (): boolean => {
    const validationErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      validationErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      validationErrors.email = 'Valid email is required'
    }

    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 8) {
      validationErrors.phone = 'Phone number is required'
    }

    if (!formData.checkInDate) {
      validationErrors.checkInDate = 'Select a check-in date'
    }

    if (!formData.checkOutDate) {
      validationErrors.checkOutDate = 'Select a check-out date'
    }

    if (
      formData.checkInDate &&
      formData.checkOutDate &&
      formData.checkOutDate < formData.checkInDate
    ) {
      validationErrors.checkOutDate = 'Check-out must be after check-in'
    }

    if (!formData.checkInTime) {
      validationErrors.checkInTime = 'Select an arrival time'
    }

    if (
      !formData.guests ||
      Number(formData.guests) < minGuests ||
      Number(formData.guests) > maxGuests
    ) {
      validationErrors.guests = `Guests must be between ${minGuests} and ${maxGuests}`
    }

    if (!formData.roomType) {
      validationErrors.roomType = 'Choose a room type'
    }

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate() || !onSubmit) return

    try {
      setSubmitting(true)
      await onSubmit({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        checkInDate: formData.checkInDate,
        checkInTime: formData.checkInTime,
        checkOutDate: formData.checkOutDate,
        guests: Number(formData.guests),
        roomType: formData.roomType,
        requests: formData.requests.trim(),
      })

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        checkInDate: '',
        checkInTime: '15:00',
        checkOutDate: '',
        guests: minGuests,
        roomType:
          roomOptions.length > 0 && roomOptions[0]
            ? (roomOptions[0]?.value ?? 'standard')
            : 'standard',
        requests: '',
      })
      setErrors({})
    } catch (error) {
      logger.error('Error submitting reservation booking:', error)
      const err = error as Error
      setErrors({ submit: err.message || 'Failed to submit reservation. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm sm:text-base font-medium text-[var(--text-main)]">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('fullName', event.target.value)
            }
            placeholder="Jane Doe"
            className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            disabled={disabled || submitting}
            required
          />
          {errors.fullName && (
            <p className="text-[10px] sm:text-xs text-rose-400">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm sm:text-base font-medium text-[var(--text-main)]">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('email', event.target.value)
            }
            placeholder="jane@example.com"
            className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            disabled={disabled || submitting}
            required
          />
          {errors.email && <p className="text-[10px] sm:text-xs text-rose-400">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm sm:text-base font-medium text-[var(--text-main)]">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('phone', event.target.value)
            }
            placeholder="+1 555 123 4567"
            className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            disabled={disabled || submitting}
            required
          />
          {errors.phone && <p className="text-[10px] sm:text-xs text-rose-400">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm sm:text-base font-medium text-[var(--text-main)]">Guests</label>
          <input
            type="number"
            min={minGuests}
            max={maxGuests}
            value={formData.guests}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('guests', Number(event.target.value))
            }
            className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            disabled={disabled || submitting}
            required
          />
          {errors.guests && <p className="text-[10px] sm:text-xs text-rose-400">{errors.guests}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm sm:text-base font-medium text-[var(--text-main)]">
            Check-in
          </label>
          <input
            type="date"
            min={today}
            value={formData.checkInDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const dateValue = event.target.value
              updateField('checkInDate', dateValue)
              if (formData.checkOutDate && formData.checkOutDate < dateValue) {
                updateField('checkOutDate', dateValue)
              }
            }}
            className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            disabled={disabled || submitting}
            required
          />
          {errors.checkInDate && (
            <p className="text-[10px] sm:text-xs text-rose-400">{errors.checkInDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm sm:text-base font-medium text-[var(--text-main)]">
            Check-out
          </label>
          <input
            type="date"
            min={formData.checkInDate || today}
            value={formData.checkOutDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('checkOutDate', event.target.value)
            }
            className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            disabled={disabled || submitting}
            required
          />
          {errors.checkOutDate && (
            <p className="text-[10px] sm:text-xs text-rose-400">{errors.checkOutDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm sm:text-base font-medium text-[var(--text-main)]">
            Arrival Time
          </label>
          <input
            type="time"
            value={formData.checkInTime}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('checkInTime', event.target.value)
            }
            className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            disabled={disabled || submitting}
            required
          />
          {errors.checkInTime && (
            <p className="text-[10px] sm:text-xs text-rose-400">{errors.checkInTime}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm sm:text-base font-medium text-[var(--text-main)]">Room Type</span>
        <div className="space-y-3 sm:space-y-4">
          {roomOptions.map(option => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 sm:gap-4 md:gap-6 rounded-xl sm:rounded-2xl border px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 transition ${
                formData.roomType === option.value
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-theme hover:border-[var(--accent)]/40'
              }`}
              style={
                formData.roomType !== option.value
                  ? {
                      backgroundColor: isLightTheme
                        ? 'rgba(0, 0, 0, 0.04)'
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
                    }
                  : undefined
              }
            >
              <input
                type="radio"
                className="mt-1 h-4 w-4 border-theme-medium bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
                name="roomType"
                value={option.value}
                checked={formData.roomType === option.value}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField('roomType', event.target.value)
                }
                disabled={disabled || submitting}
                required
              />
              <div>
                <p className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                  {option.label}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--text-main)]/60">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
        {errors.roomType && (
          <p className="text-[10px] sm:text-xs text-rose-400">{errors.roomType}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm sm:text-base font-medium text-[var(--text-main)]">
          Special Requests
        </label>
        <textarea
          value={formData.requests}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            updateField('requests', event.target.value)
          }
          placeholder="Let us know about dietary needs, celebrations, or arrival notes"
          rows={4}
          className="w-full min-h-[44px] rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 py-3 text-sm sm:text-base text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          disabled={disabled || submitting}
        />
      </div>

      <div className="rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-[10px] sm:text-xs text-[var(--text-main)]/70">
        By submitting this reservation you agree to the {propertyName} stay policies. A confirmation
        email will be sent instantly and our concierge may reach out by phone for any
        clarifications.
      </div>

      <button
        type="submit"
        className="w-full min-h-[44px] rounded-full bg-[var(--accent)] px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold text-black transition hover:bg-[var(--accent)]/90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || submitting}
      >
        {submitting ? 'Submitting...' : 'Confirm Reservation'}
      </button>
    </form>
  )
}

export default ReservationBookingForm
