/**
 * Reservation Settings Service
 *
 * Service layer for managing reservation system settings.
 * Admin can control hours, capacity, features, etc.
 */

import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Get current reservation settings
 *
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getReservationSettings() {
  try {
    const { data, error } = await supabase.from('reservation_settings').select('*').single()

    if (error) {
      logger.error('Error fetching reservation settings:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load reservation settings',
      }
    }

    return {
      success: true,
      data: data,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getReservationSettings:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update reservation settings (admin only)
 *
 * @param {Object} settings - Updated settings
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateReservationSettings(settings) {
  try {
    // Get the current settings ID (should only be one row)
    const { data: current } = await supabase.from('reservation_settings').select('id').single()

    if (!current) {
      return {
        success: false,
        error: 'No settings record found',
      }
    }

    // Update settings
    const { error } = await supabase
      .from('reservation_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)

    if (error) {
      logger.error('Error updating reservation settings:', error)
      return {
        success: false,
        error: error.message || 'Failed to update settings',
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in updateReservationSettings:', err)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Generate time slots based on current settings
 *
 * @param {Object} settings - Reservation settings
 * @returns {Array<string>} Array of time strings (HH:MM)
 */
export function generateTimeSlotsFromSettings(settings) {
  if (!settings) return []

  const slots = []
  const interval = settings.time_slot_interval || 30

  // Parse opening and closing times
  const [openHour, openMin] = settings.opening_time.split(':').map(Number)
  const [closeHour, closeMin] = settings.closing_time.split(':').map(Number)

  let currentHour = openHour
  let currentMin = openMin

  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
    slots.push(timeString)

    // Add interval
    currentMin += interval
    if (currentMin >= 60) {
      currentMin -= 60
      currentHour += 1
    }
  }

  return slots
}

/**
 * Check if a date is blocked
 *
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array<string>} blockedDates - Array of blocked dates
 * @returns {boolean}
 */
export function isDateBlocked(date, blockedDates = []) {
  return blockedDates.includes(date)
}

/**
 * Check if a day of week is operating
 *
 * @param {Date} date - JavaScript Date object
 * @param {Array<number>} operatingDays - Array of operating day numbers
 * @returns {boolean}
 */
export function isDayOperating(date, operatingDays = [0, 1, 2, 3, 4, 5, 6]) {
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  return operatingDays.includes(dayOfWeek)
}

/**
 * Get minimum allowed booking date based on settings
 *
 * @param {boolean} allowSameDayBooking - Whether same-day booking is allowed
 * @returns {Date}
 */
export function getMinBookingDate(allowSameDayBooking = true) {
  const today = new Date()

  if (allowSameDayBooking) {
    return today
  }

  // Next day
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

/**
 * Get maximum allowed booking date based on settings
 *
 * @param {number} advanceBookingDays - Number of days in advance allowed
 * @returns {Date}
 */
export function getMaxBookingDate(advanceBookingDays = 30) {
  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + advanceBookingDays)
  return maxDate
}

export default {
  getReservationSettings,
  updateReservationSettings,
  generateTimeSlotsFromSettings,
  isDateBlocked,
  isDayOperating,
  getMinBookingDate,
  getMaxBookingDate,
}
