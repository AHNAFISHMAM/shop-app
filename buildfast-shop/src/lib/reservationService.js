/**
 * Reservation Service
 *
 * Service layer for reservation-related operations.
 * Abstracts Supabase RPC calls for reservations.
 */

import { supabase } from './supabase';
import { logger } from '../utils/logger';

/**
 * Create a new reservation using RPC function
 *
 * @param {Object} reservationData - Reservation details
 * @param {string|null} reservationData.userId - User ID (null for guests)
 * @param {string} reservationData.customerName - Customer full name
 * @param {string} reservationData.customerEmail - Customer email
 * @param {string} reservationData.customerPhone - Customer phone
 * @param {string} reservationData.reservationDate - Date (YYYY-MM-DD)
 * @param {string} reservationData.reservationTime - Time (HH:MM:SS)
 * @param {number} reservationData.partySize - Number of guests (1-20)
 * @param {string|null} reservationData.specialRequests - Optional dining/room requests
 * @param {string|null} reservationData.checkInDate - Check-in date (YYYY-MM-DD)
 * @param {string|null} reservationData.checkOutDate - Check-out date (YYYY-MM-DD)
 * @param {string|null} reservationData.roomType - Selected room type
 * @param {string|null} reservationData.guestNotes - Additional notes for concierge
 * @returns {Promise<{success: boolean, reservationId: string|null, error: string|null}>}
 */
export async function createReservation(reservationData) {
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
      guestNotes
    } = reservationData;

    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      return {
        success: false,
        reservationId: null,
        error: 'Customer name is required'
      };
    }

    if (!customerEmail || customerEmail.trim() === '') {
      return {
        success: false,
        reservationId: null,
        error: 'Email address is required'
      };
    }

    if (!customerPhone || customerPhone.trim() === '') {
      return {
        success: false,
        reservationId: null,
        error: 'Phone number is required'
      };
    }

    if (!reservationDate) {
      return {
        success: false,
        reservationId: null,
        error: 'Reservation date is required'
      };
    }

    if (!reservationTime) {
      return {
        success: false,
        reservationId: null,
        error: 'Reservation time is required'
      };
    }

    if (checkOutDate && reservationDate && checkOutDate < reservationDate) {
      return {
        success: false,
        reservationId: null,
        error: 'Check-out date must be after check-in date'
      };
    }

    const normalizedTime = reservationTime.length === 5 ? `${reservationTime}:00` : reservationTime;

    if (!partySize || partySize < 1 || partySize > 20) {
      return {
        success: false,
        reservationId: null,
        error: 'Party size must be between 1 and 20 guests'
      };
    }

    // Insert reservation directly (supports new fields)
    const { data, error } = await supabase
      .from('table_reservations')
      .insert([{
        user_id: userId || null,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        reservation_date: reservationDate,
        reservation_time: normalizedTime,
        party_size: parseInt(partySize),
        special_requests: specialRequests?.trim() || null,
        occasion: occasion || null,
        table_preference: tablePreference || null,
        status: 'pending',
        check_in_date: checkInDate || reservationDate,
        check_out_date: checkOutDate || null,
        room_type: roomType || null,
        guest_notes: guestNotes?.trim() || null
      }])
      .select('id')
      .single();

    const reservationId = data?.id;

    if (error) {
      logger.error('Error creating reservation:', error);

      // Return user-friendly error messages
      if (error.message.includes('already have a reservation')) {
        return {
          success: false,
          reservationId: null,
          error: 'You already have a reservation around this time. Please choose a different time.'
        };
      }

      if (error.message.includes('past')) {
        return {
          success: false,
          reservationId: null,
          error: 'Cannot make reservations for past dates or times.'
        };
      }

      return {
        success: false,
        reservationId: null,
        error: error.message || 'Failed to create reservation'
      };
    }

    return {
      success: true,
      reservationId: reservationId,
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in createReservation:', err);
    return {
      success: false,
      reservationId: null,
      error: 'An unexpected error occurred while creating your reservation'
    };
  }
}

/**
 * Get user's reservations
 *
 * @param {string|null} userId - User ID (for authenticated users)
 * @param {string|null} email - Email address (for guest lookup)
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getUserReservations(userId = null, email = null) {
  try {
    let query = supabase
      .from('table_reservations')
      .select('*')
      .order('reservation_date', { ascending: false })
      .order('reservation_time', { ascending: false });

    if (userId) {
      // Authenticated user
      query = query.eq('user_id', userId);
    } else if (email) {
      // Guest user - lookup by email
      query = query.eq('customer_email', email);
    } else {
      return {
        success: false,
        data: null,
        error: 'User ID or email is required'
      };
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching reservations:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load reservations'
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in getUserReservations:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get reservation by ID
 *
 * @param {string} reservationId - Reservation ID
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getReservationById(reservationId) {
  try {
    const { data, error } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error) {
      logger.error('Error fetching reservation:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Reservation not found'
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in getReservationById:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Cancel a reservation (user-initiated)
 *
 * @param {string} reservationId - Reservation ID
 * @param {string} userId - User ID (to verify ownership)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function cancelReservation(reservationId, userId) {
  try {
    const { data, error } = await supabase
      .from('table_reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('user_id', userId)
      .in('status', ['pending', 'confirmed'])
      .select();

    if (error) {
      logger.error('Error cancelling reservation:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel reservation'
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Reservation not found or cannot be cancelled'
      };
    }

    return {
      success: true,
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in cancelReservation:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Admin: Get all reservations with filters
 *
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.date - Filter by date (YYYY-MM-DD)
 * @param {number} filters.limit - Limit results
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getAllReservations(filters = {}) {
  try {
    let query = supabase
      .from('table_reservations')
      .select('*')
      .order('reservation_date', { ascending: false })
      .order('reservation_time', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.date) {
      query = query.eq('reservation_date', filters.date);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching all reservations:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load reservations'
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in getAllReservations:', err);
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Admin: Update reservation status
 *
 * @param {string} reservationId - Reservation ID
 * @param {string} status - New status (pending, confirmed, declined, cancelled, completed, no_show)
 * @param {string|null} adminNotes - Optional admin notes
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateReservationStatus(reservationId, status, adminNotes = null) {
  try {
    const validStatuses = ['pending', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show'];

    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: 'Invalid status value'
      };
    }

    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from('table_reservations')
      .update(updateData)
      .eq('id', reservationId);

    if (error) {
      logger.error('Error updating reservation status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update reservation'
      };
    }

    return {
      success: true,
      error: null
    };
  } catch (err) {
    logger.error('Unexpected error in updateReservationStatus:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

export default {
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  getAllReservations,
  updateReservationStatus
};
