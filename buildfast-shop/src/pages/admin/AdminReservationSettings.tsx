import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  getReservationSettings,
  updateReservationSettings,
} from '../../lib/reservationSettingsService'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import CustomDropdown from '../../components/ui/CustomDropdown'

interface ReservationFormData {
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
  special_notice: string
}

const AdminReservationSettings = () => {
  const containerRef = useViewportAnimationTrigger()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [, setSettings] = useState<unknown>(null)

  // Form state
  const [formData, setFormData] = useState<ReservationFormData>({
    opening_time: '11:00',
    closing_time: '23:00',
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
    special_notice: '',
  })

  const [newBlockedDate, setNewBlockedDate] = useState('')

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const result = await getReservationSettings()

    if (result.success && result.data) {
      setSettings(result.data)

      // Parse and set form data - map ReservationSettings to formData
      const data = result.data
      setFormData({
        opening_time: data.opening_time?.substring(0, 5) || '11:00',
        closing_time: data.closing_time?.substring(0, 5) || '23:00',
        time_slot_interval: data.slot_duration_minutes || 30,
        max_capacity_per_slot: data.max_concurrent_reservations || 50,
        max_party_size: data.max_party_size || 20,
        min_party_size: data.min_party_size || 1,
        operating_days: (data.available_days || [])
          .map(d => parseInt(d))
          .filter(d => !isNaN(d)) || [0, 1, 2, 3, 4, 5, 6],
        allow_same_day_booking: data.min_advance_booking_hours === 0,
        advance_booking_days: data.max_advance_booking_days || 30,
        enabled_occasions: [] as string[], // Not in ReservationSettings
        enabled_preferences: [] as string[], // Not in ReservationSettings
        blocked_dates: [] as string[], // Not in ReservationSettings
        special_notice: data.custom_message || '',
      })
    } else {
      toast.error(result.error || 'Failed to load settings')
    }

    setLoading(false)
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Validate times
    if (formData.opening_time >= formData.closing_time) {
      toast.error('Opening time must be before closing time')
      setSaving(false)
      return
    }

    // Prepare data for update
    const updateData = {
      opening_time: formData.opening_time + ':00',
      closing_time: formData.closing_time + ':00',
      slot_duration_minutes: formData.time_slot_interval,
      max_concurrent_reservations: formData.max_capacity_per_slot,
      max_party_size: formData.max_party_size,
      min_party_size: formData.min_party_size,
      available_days: formData.operating_days.map(d => String(d)),
      min_advance_booking_hours: formData.allow_same_day_booking ? 0 : 24,
      max_advance_booking_days: formData.advance_booking_days,
      custom_message: formData.special_notice?.trim() || null,
    }

    const result = await updateReservationSettings(updateData)

    if (result.success) {
      toast.success('Settings updated successfully!')
      loadSettings() // Reload to confirm
    } else {
      toast.error(result.error || 'Failed to update settings')
    }

    setSaving(false)
  }

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      operating_days: prev.operating_days.includes(day)
        ? prev.operating_days.filter(d => d !== day)
        : [...prev.operating_days, day].sort(),
    }))
  }

  const toggleOccasion = (occasion: string) => {
    setFormData(prev => ({
      ...prev,
      enabled_occasions: prev.enabled_occasions.includes(occasion)
        ? prev.enabled_occasions.filter(o => o !== occasion)
        : [...prev.enabled_occasions, occasion],
    }))
  }

  const togglePreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      enabled_preferences: prev.enabled_preferences.includes(preference)
        ? prev.enabled_preferences.filter(p => p !== preference)
        : [...prev.enabled_preferences, preference],
    }))
  }

  const addBlockedDate = () => {
    if (!newBlockedDate) return

    if (formData.blocked_dates.includes(newBlockedDate)) {
      toast.error('This date is already blocked')
      return
    }

    setFormData(prev => ({
      ...prev,
      blocked_dates: [...prev.blocked_dates, newBlockedDate].sort(),
    }))

    setNewBlockedDate('')
    toast.success('Date added to blocked list')
  }

  const removeBlockedDate = (date: string) => {
    setFormData(prev => ({
      ...prev,
      blocked_dates: prev.blocked_dates.filter(d => d !== date),
    }))
    toast.success('Date removed from blocked list')
  }

  const days = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ]

  const occasions = [
    { value: 'birthday', label: 'Birthday', icon: '🎂' },
    { value: 'anniversary', label: 'Anniversary', icon: '💑' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'date', label: 'Date Night', icon: '🌹' },
    { value: 'celebration', label: 'Celebration', icon: '🎉' },
    { value: 'casual', label: 'Casual', icon: '☕' },
  ]

  const preferences = [
    { value: 'window', label: 'Window Seat', icon: '🪟' },
    { value: 'quiet', label: 'Quiet Area', icon: '🤫' },
    { value: 'bar', label: 'Near Bar', icon: '🍷' },
    { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
    { value: 'any', label: 'No Preference', icon: '✨' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div
          data-animate="fade-scale"
          data-animate-active="false"
          className="text-center space-y-3"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto"></div>
          <p className="text-muted">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-animate="fade-scale"
      data-animate-active="false"
      className="admin-page w-full bg-[var(--bg-main)] px-6 py-10 text-[var(--text-main)]"
    >
      <div className="space-y-6">
        {/* Header */}
        <div data-animate="fade-rise" data-animate-active="false">
          <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Reservation Settings</h1>
          <p className="text-muted">
            Configure how customers can make reservations at your restaurant
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Operating Hours Section */}
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-4">
              ⏰ Operating Hours
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={formData.opening_time}
                  onChange={e => setFormData({ ...formData, opening_time: e.target.value })}
                  className="w-full rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={formData.closing_time}
                  onChange={e => setFormData({ ...formData, closing_time: e.target.value })}
                  className="w-full rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                Time Slot Interval
              </label>
              <CustomDropdown
                options={[
                  { value: '15', label: '15 minutes' },
                  { value: '30', label: '30 minutes' },
                  { value: '60', label: '60 minutes' },
                ]}
                value={String(formData.time_slot_interval)}
                onChange={e => {
                  const value = e.target.value
                  setFormData({
                    ...formData,
                    time_slot_interval:
                      typeof value === 'string'
                        ? parseInt(value) || 30
                        : typeof value === 'number'
                          ? value
                          : 30,
                  })
                }}
                placeholder="Select interval"
                maxVisibleItems={5}
              />
            </div>
          </div>

          {/* Capacity Settings */}
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-4">
              👥 Capacity Settings
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Max Capacity Per Slot
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_capacity_per_slot}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      max_capacity_per_slot: parseInt(e.target.value) || 50,
                    })
                  }
                  className="w-full rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Min Party Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.min_party_size}
                  onChange={e =>
                    setFormData({ ...formData, min_party_size: parseInt(e.target.value) || 1 })
                  }
                  className="w-full rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Max Party Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_party_size}
                  onChange={e =>
                    setFormData({ ...formData, max_party_size: parseInt(e.target.value) || 20 })
                  }
                  className="w-full rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Operating Days */}
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-4">
              📅 Operating Days
            </h2>

            <div className="flex flex-wrap gap-2">
              {days.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    formData.operating_days.includes(day.value)
                      ? 'bg-[var(--accent)] text-[#111]'
                      : 'bg-[rgba(255,255,255,0.05)] text-muted border border-theme'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {formData.operating_days.length === 0 && (
              <p className="text-sm text-red-400 mt-2">
                ⚠️ You must select at least one operating day
              </p>
            )}
          </div>

          {/* Booking Policies */}
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-4">
              📋 Booking Policies
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_same_day_booking}
                  onChange={e =>
                    setFormData({ ...formData, allow_same_day_booking: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-theme-medium bg-[rgba(255,255,255,0.05)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-[var(--text-main)]">Allow same-day bookings</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Advance Booking (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.advance_booking_days}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      advance_booking_days: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full max-w-xs rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none"
                  required
                />
                <p className="text-xs text-muted mt-1">
                  How many days in advance customers can book
                </p>
              </div>
            </div>
          </div>

          {/* Occasion Options */}
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-4">
              🎉 Occasion Options
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {occasions.map(occasion => (
                <button
                  key={occasion.value}
                  type="button"
                  onClick={() => toggleOccasion(occasion.value)}
                  className={`px-4 py-3 rounded-lg font-medium transition text-left ${
                    formData.enabled_occasions.includes(occasion.value)
                      ? 'bg-[var(--accent)] text-[#111]'
                      : 'bg-[rgba(255,255,255,0.05)] text-muted border border-theme'
                  }`}
                >
                  <span className="text-lg mr-2">{occasion.icon}</span>
                  {occasion.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Preferences */}
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-4">
              🪑 Table Preferences
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {preferences.map(preference => (
                <button
                  key={preference.value}
                  type="button"
                  onClick={() => togglePreference(preference.value)}
                  className={`px-4 py-3 rounded-lg font-medium transition text-left ${
                    formData.enabled_preferences.includes(preference.value)
                      ? 'bg-[var(--accent)] text-[#111]'
                      : 'bg-[rgba(255,255,255,0.05)] text-muted border border-theme'
                  }`}
                >
                  <span className="text-lg mr-2">{preference.icon}</span>
                  {preference.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blocked Dates */}
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-4">🚫 Blocked Dates</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="date"
                value={newBlockedDate}
                onChange={e => setNewBlockedDate(e.target.value)}
                className="flex-1 rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none"
              />
              <button
                type="button"
                onClick={addBlockedDate}
                className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-[#111] font-medium hover:opacity-90 transition"
              >
                Add
              </button>
            </div>

            {formData.blocked_dates.length > 0 ? (
              <div className="space-y-2">
                {formData.blocked_dates.map(date => (
                  <div
                    key={date}
                    className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-theme"
                  >
                    <span className="text-[var(--text-main)]">{date}</span>
                    <button
                      type="button"
                      onClick={() => removeBlockedDate(date)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No blocked dates</p>
            )}
          </div>

          {/* Special Notice */}
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-main)] mb-4">
              📢 Special Notice
            </h2>

            <textarea
              value={formData.special_notice}
              onChange={e => setFormData({ ...formData, special_notice: e.target.value })}
              rows={3}
              placeholder="Optional message to display on the reservation page (e.g., holiday hours, special events)"
              className="w-full rounded-lg border border-theme bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || formData.operating_days.length === 0}
              className="px-8 py-3 rounded-full bg-[var(--accent)] text-[#111] font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminReservationSettings
