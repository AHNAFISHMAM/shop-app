import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  getReservationSettings,
  generateTimeSlotsFromSettings,
  isDateBlocked,
  isDayOperating,
  getMinBookingDate,
  getMaxBookingDate
} from '../lib/reservationSettingsService';
import PropTypes from 'prop-types';
import { logger } from '../utils/logger';

const ReservationForm = ({ onSubmit, disabled = false, className = '' }) => {
  const { user } = useAuth();
  const formRef = useRef(null);


  // Settings state
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    requests: '',
    occasion: '',
    preference: ''
  });

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);

  // Load reservation settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoadingSettings(true);
    const result = await getReservationSettings();

    if (result.success && result.data) {
      setSettings(result.data);
    } else {
      logger.error('Failed to load settings:', result.error);
      // Use defaults if settings fail to load
      setSettings({
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
        special_notice: null
      });
    }

    setLoadingSettings(false);
  };

  // Generate time slots based on settings
  const timeSlots = settings ? generateTimeSlotsFromSettings(settings) : [];

  // All possible occasions
  const allOccasions = [
    { value: 'birthday', label: 'Birthday', icon: '🎂' },
    { value: 'anniversary', label: 'Anniversary', icon: '💑' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'date', label: 'Date Night', icon: '🌹' },
    { value: 'celebration', label: 'Celebration', icon: '🎉' },
    { value: 'casual', label: 'Casual', icon: '☕' }
  ];

  // All possible preferences
  const allPreferences = [
    { value: 'window', label: 'Window Seat', icon: '🪟' },
    { value: 'quiet', label: 'Quiet Area', icon: '🤫' },
    { value: 'bar', label: 'Near Bar', icon: '🍷' },
    { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
    { value: 'any', label: 'No Preference', icon: '✨' }
  ];

  // Filter based on admin settings
  const occasions = settings
    ? allOccasions.filter(occ => settings.enabled_occasions.includes(occ.value))
    : allOccasions;

  const preferences = settings
    ? allPreferences.filter(pref => settings.enabled_preferences.includes(pref.value))
    : allPreferences;

  const checkAvailability = useCallback(async () => {
    if (!settings) return;

    setCheckingAvailability(true);
    setIsAvailable(null);

    try {
      // Check if date is blocked
      const blockedDates = settings.blocked_dates || [];
      if (isDateBlocked(formData.date, blockedDates)) {
        setIsAvailable(false);
        setCheckingAvailability(false);
        return;
      }

      // Check if day is operating
      const dateObj = new Date(formData.date + 'T00:00:00');
      if (!isDayOperating(dateObj, settings.operating_days)) {
        setIsAvailable(false);
        setCheckingAvailability(false);
        return;
      }

      // Query existing reservations for the selected date/time
      const { data: existingReservations, error } = await supabase
        .from('table_reservations')
        .select('party_size')
        .eq('reservation_date', formData.date)
        .eq('reservation_time', formData.time)
        .in('status', ['pending', 'confirmed']);

      if (error) {
        logger.error('Error checking availability:', error);
        setIsAvailable(true); // Default to available if check fails
        return;
      }

      // Use max capacity from settings
      const maxCapacity = settings.max_capacity_per_slot || 50;
      const totalGuests = existingReservations.reduce((sum, r) => sum + r.party_size, 0);
      const available = totalGuests + parseInt(formData.guests) <= maxCapacity;

      setIsAvailable(available);

    } catch (err) {
      logger.error('Availability check error:', err);
      setIsAvailable(true);
    } finally {
      setCheckingAvailability(false);
    }
  }, [settings, formData.date, formData.time, formData.guests]);

  // Check availability when date/time/guests change
  useEffect(() => {
    if (formData.date && formData.time && formData.guests) {
      checkAvailability();
    }
  }, [formData.date, formData.time, formData.guests, checkAvailability]);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[\d\s\-+()]{8,20}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Time validation
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    // Guests validation
    if (!formData.guests || formData.guests < (settings?.min_party_size || 1) || formData.guests > (settings?.max_party_size || 20)) {
      newErrors.guests = `Party size must be between ${settings?.min_party_size || 1} and ${settings?.max_party_size || 20}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    if (onSubmit) {
      await onSubmit(formData);

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
        preference: ''
      });
      setErrors({});
    }
  };


  // Calculate min and max dates based on settings
  const getMinDate = () => {
    if (!settings) return new Date().toISOString().split('T')[0];
    const minDate = getMinBookingDate(settings.allow_same_day_booking);
    return minDate.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    if (!settings) return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const maxDate = getMaxBookingDate(settings.advance_booking_days);
    return maxDate.toISOString().split('T')[0];
  };

  // Show loading state while settings load
  if (loadingSettings) {
    return (
      <div className={`card-soft p-12 ${className}`}>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted">Loading reservation form...</p>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {/* Special Notice from Admin */}
      {settings?.special_notice && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 mb-4">
          <div className="flex gap-2">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-200">{settings.special_notice}</p>
          </div>
        </div>
      )}

      {/* Compact Grid Layout - Date, Time, Party Size, Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">📅 Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            disabled={disabled}
            min={getMinDate()}
            max={getMaxDate()}
            className="input-base"
          />
        </div>

        {/* Time Selection - Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">⏰ Time *</label>
          <select
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
            disabled={disabled || !formData.date}
            className="input-base"
          >
            <option value="">Select time</option>
            {timeSlots.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>

        {/* Party Size */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">👥 Party Size *</label>
          <input
            type="number"
            value={formData.guests}
            onChange={(e) => {
              setFormData({ ...formData, guests: parseInt(e.target.value) || 1 });
              if (errors.guests) setErrors({ ...errors, guests: '' });
            }}
            min={settings?.min_party_size || 1}
            max={settings?.max_party_size || 20}
            required
            disabled={disabled}
            className={`input-base ${errors.guests ? 'border-red-500' : ''}`}
            placeholder="Number of guests"
          />
          {errors.guests && (
            <p className="text-xs text-red-500 mt-1">{errors.guests}</p>
          )}
        </div>

        {/* Availability Indicator - Compact */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">Status</label>
          {formData.date && formData.time && formData.guests ? (
            <div className={`px-3 py-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              checkingAvailability
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                : isAvailable
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-orange-500/30 bg-orange-500/10 text-orange-300'
            }`}>
              {checkingAvailability ? (
                <>
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : isAvailable ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Available</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Limited</span>
                </>
              )}
            </div>
          ) : (
            <div className="px-3 py-2.5 rounded-lg border border-theme bg-elevated text-xs text-muted">
              Select date & time
            </div>
          )}
        </div>
      </div>

      {/* Contact Information - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-theme">
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            required
            disabled={disabled}
            className={`input-base ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Your name"
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            required
            disabled={disabled}
            className={`input-base ${errors.email ? 'border-red-500' : ''}`}
            placeholder="you@email.com"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">Phone *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
              if (errors.phone) setErrors({ ...errors, phone: '' });
            }}
            required
            disabled={disabled}
            className={`input-base ${errors.phone ? 'border-red-500' : ''}`}
            placeholder="01XXXXXXXXX"
          />
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Optional Fields - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-theme">
        {/* Occasion - Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">Occasion (Optional)</label>
          <select
            value={formData.occasion}
            onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
            disabled={disabled}
            className="input-base"
          >
            <option value="">None</option>
            {occasions.map(occ => (
              <option key={occ.value} value={occ.value}>{occ.icon} {occ.label}</option>
            ))}
          </select>
        </div>

        {/* Table Preference - Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[var(--text-main)]">Table Preference (Optional)</label>
          <select
            value={formData.preference}
            onChange={(e) => setFormData({ ...formData, preference: e.target.value })}
            disabled={disabled}
            className="input-base"
          >
            <option value="">No preference</option>
            {preferences.map(pref => (
              <option key={pref.value} value={pref.value}>{pref.icon} {pref.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Special Requests - Compact */}
      <div className="space-y-2 pt-2 border-t border-theme">
        <label className="text-xs font-medium text-[var(--text-main)]">Special Requests (Optional)</label>
        <textarea
          value={formData.requests}
          onChange={(e) => setFormData({ ...formData, requests: e.target.value })}
          rows="2"
          disabled={disabled}
          className="input-base resize-none"
          placeholder="Dietary requirements, allergies, or special requests..."
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-theme">
        <button
          type="submit"
          disabled={!formData.date || !formData.time || !formData.guests || !formData.name || !formData.email || !formData.phone || disabled}
          className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {disabled ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Booking...
            </>
          ) : (
            <>
              ✓ Confirm Reservation
            </>
          )}
        </button>
      </div>
    </form>
  );
};

ReservationForm.propTypes = {
  onSubmit: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string
}

export default ReservationForm;

