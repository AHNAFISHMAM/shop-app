/**
 * Reservation Service
 *
 * Service layer for reservation-related operations.
 * Abstracts Supabase RPC calls for reservations.
 */

import { supabase } from './supabase'
import { logger } from '../utils/logger'
import type { Reservation, CreateReservationResult, Updates } from './database.types'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Reservation creation data
 */
export interface ReservationData {
  userId?: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  reservationDate: string
  reservationTime: string
  partySize: number
  specialRequests?: string | null
  occasion?: string | null
  tablePreference?: string | null
  checkInDate?: string | null
  checkOutDate?: string | null
  roomType?: string | null
  guestNotes?: string | null
}

/**
 * Reservation response type
 */
export interface ReservationResponse {
  success: boolean
  reservationId: string | null
  error: string | null
}

/**
 * Reservations response type
 */
export interface ReservationsResponse {
  success: boolean
  data: Reservation[] | null
  error: string | null
}

/**
 * Reservation filters
 */
export interface ReservationFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
  userId?: string
  email?: string
  limit?: number
}

/**
 * Create a new reservation using RPC function
 *
 * @param reservationData - Reservation details
 * @returns Promise with reservation ID or error
 */
export async function createReservation(
  reservationData: ReservationData
): Promise<ReservationResponse> {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      reservationDate,
      reservationTime,
      partySize,
      specialRequests,
      occasion,
      tablePreference,
      checkInDate,
      checkOutDate,
      roomType,
      guestNotes,
    } = reservationData

    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      return {
        success: false,
        reservationId: null,
        error: 'Customer name is required',
      }
    }

    if (!customerEmail || customerEmail.trim() === '') {
      return {
        success: false,
        reservationId: null,
        error: 'Email address is required',
      }
    }

    if (!customerPhone || customerPhone.trim() === '') {
      return {
        success: false,
        reservationId: null,
        error: 'Phone number is required',
      }
    }

    if (!reservationDate) {
      return {
        success: false,
        reservationId: null,
        error: 'Reservation date is required',
      }
    }

    if (!reservationTime) {
      return {
        success: false,
        reservationId: null,
        error: 'Reservation time is required',
      }
    }

    if (checkOutDate && reservationDate && checkOutDate < reservationDate) {
      return {
        success: false,
        reservationId: null,
        error: 'Check-out date must be after check-in date',
      }
    }

    const normalizedTime = reservationTime.length === 5 ? `${reservationTime}:00` : reservationTime

    if (!partySize || partySize < 1 || partySize > 20) {
      return {
        success: false,
        reservationId: null,
        error: 'Party size must be between 1 and 20 guests',
      }
    }

    // Use RPC function for server-side validation and atomic creation
    // The RPC function provides: duplicate checking, past date/time validation, party size validation
    const { data, error: rpcError } = await supabase.rpc('create_reservation', {
      _user_id: userId || null,
      _customer_name: customerName.trim(),
      _customer_email: customerEmail.trim(),
      _customer_phone: customerPhone.trim(),
      _reservation_date: reservationDate,
      _reservation_time: normalizedTime,
      _party_size: parseInt(String(partySize), 10),
      _special_requests: specialRequests?.trim() || null,
    } as never)

    let error: PostgrestError | null = rpcError
    let finalReservationId: string | null = null

    if (data) {
      const result = data as CreateReservationResult
      finalReservationId = result.reservation_id
      if (result.error) {
        error = {
          message: result.error,
          details: result.error,
          hint: null,
          code: 'PGRST_ERROR',
        } as unknown as PostgrestError
      } else {
        error = null
      }
    }

    // If RPC succeeded and we have additional fields not supported by RPC, update the reservation
    if (
      !error &&
      finalReservationId &&
      (occasion || tablePreference || checkInDate || checkOutDate || roomType || guestNotes)
    ) {
      const updateData: Updates<'table_reservations'> = {}
      if (occasion) updateData.occasion = occasion
      if (tablePreference) updateData.table_preference = tablePreference
      if (checkInDate) updateData.check_in_date = checkInDate
      if (checkOutDate) updateData.check_out_date = checkOutDate
      if (roomType) updateData.room_type = roomType
      if (guestNotes) updateData.guest_notes = guestNotes

      const { error: updateError } = await supabase
        .from('table_reservations')
        // @ts-expect-error - Supabase types don't properly infer Updates type
        .update(updateData)
        .eq('id', finalReservationId)

      if (updateError) {
        // Log warning but don't fail - core reservation was created successfully
        logger.warn('RPC succeeded but additional fields update failed:', updateError)
      }
    }

    if (error) {
      logger.error('Error creating reservation:', error)

      // Return user-friendly error messages from RPC function
      if (error.message && error.message.includes('already have a reservation')) {
        return {
          success: false,
          reservationId: null,
          error: 'You already have a reservation around this time. Please choose a different time.',
        }
      }

      if (
        error.message &&
        (error.message.includes('past') || error.message.includes('Cannot make reservations'))
      ) {
        return {
          success: false,
          reservationId: null,
          error: 'Cannot make reservations for past dates or times.',
        }
      }

      if (error.message && error.message.includes('party_size')) {
        return {
          success: false,
          reservationId: null,
          error: 'Party size must be between 1 and 20 guests.',
        }
      }

      return {
        success: false,
        reservationId: null,
        error: error.message || 'Failed to create reservation',
      }
    }

    return {
      success: true,
      reservationId: finalReservationId,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in createReservation:', err)
    return {
      success: false,
      reservationId: null,
      error: 'An unexpected error occurred while creating your reservation',
    }
  }
}

/**
 * Get user's reservations
 *
 * @param userId - User ID (for authenticated users)
 * @param email - Email address (for guest lookup)
 * @returns Promise with reservations data or error
 */
export async function getUserReservations(
  userId: string | null = null,
  email: string | null = null
): Promise<ReservationsResponse> {
  try {
    if (!userId && !email) {
      return {
        success: false,
        data: null,
        error: 'User ID or email is required',
      }
    }

    let query = supabase.from('table_reservations').select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (email) {
      query = query.eq('customer_email', email)
    }

    const { data, error } = await query.order('reservation_date', { ascending: false })

    if (error) {
      logger.error('Error fetching reservations:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load reservations',
      }
    }

    return {
      success: true,
      data: (data as Reservation[]) || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getUserReservations:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get reservation by ID
 *
 * @param reservationId - Reservation ID
 * @returns Promise with reservation data or error
 */
export async function getReservationById(reservationId: string): Promise<{
  success: boolean
  data: Reservation | null
  error: string | null
}> {
  try {
    if (!reservationId) {
      return {
        success: false,
        data: null,
        error: 'Reservation ID is required',
      }
    }

    const { data, error } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('id', reservationId)
      .single()

    if (error) {
      logger.error('Error fetching reservation:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load reservation',
      }
    }

    return {
      success: true,
      data: data as Reservation,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getReservationById:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Cancel a reservation
 *
 * @param reservationId - Reservation ID
 * @param userId - User ID (for authorization)
 * @returns Promise with success status or error
 */
export async function cancelReservation(
  reservationId: string,
  _userId: string | null = null
): Promise<ReservationResponse> {
  try {
    if (!reservationId) {
      return {
        success: false,
        reservationId: null,
        error: 'Reservation ID is required',
      }
    }

    const { data, error } = await supabase
      .from('table_reservations')
      // @ts-expect-error - Supabase types don't properly infer Updates type
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .select('id')
      .single()

    if (error) {
      logger.error('Error cancelling reservation:', error)
      return {
        success: false,
        reservationId: null,
        error: error.message || 'Failed to cancel reservation',
      }
    }

    return {
      success: true,
      reservationId: (data as { id: string } | null)?.id || null,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in cancelReservation:', err)
    return {
      success: false,
      reservationId: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all reservations (admin only)
 *
 * @param filters - Optional filters
 * @returns Promise with reservations data or error
 */
export async function getAllReservations(
  filters: ReservationFilters = {}
): Promise<ReservationsResponse> {
  try {
    let query = supabase
      .from('table_reservations')
      .select('*')
      .order('reservation_date', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.email) {
      query = query.eq('customer_email', filters.email)
    }

    if (filters.dateFrom) {
      query = query.gte('reservation_date', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('reservation_date', filters.dateTo)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching reservations:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load reservations',
      }
    }

    return {
      success: true,
      data: (data as Reservation[]) || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getAllReservations:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update reservation status (admin only)
 *
 * @param reservationId - Reservation ID
 * @param status - New status
 * @param adminNotes - Optional admin notes
 * @returns Promise with success status or error
 */
export async function updateReservationStatus(
  reservationId: string,
  status: string,
  adminNotes: string | null = null
): Promise<ReservationResponse> {
  try {
    if (!reservationId || !status) {
      return {
        success: false,
        reservationId: null,
        error: 'Reservation ID and status are required',
      }
    }

    const updateData: Record<string, unknown> = { status }
    if (adminNotes) {
      updateData.guest_notes = adminNotes
    }

    const { data, error } = await supabase
      .from('table_reservations')
      // @ts-expect-error - Supabase types don't properly infer Updates type
      .update(updateData)
      .eq('id', reservationId)
      .select('id')
      .single()

    if (error) {
      logger.error('Error updating reservation status:', error)
      return {
        success: false,
        reservationId: null,
        error: error.message || 'Failed to update reservation status',
      }
    }

    return {
      success: true,
      reservationId: (data as { id: string } | null)?.id || null,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in updateReservationStatus:', err)
    return {
      success: false,
      reservationId: null,
      error: 'An unexpected error occurred',
    }
  }
}

export default {
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  getAllReservations,
  updateReservationStatus,
}
