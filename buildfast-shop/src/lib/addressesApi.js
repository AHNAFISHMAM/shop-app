import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Customer Addresses API
 *
 * Functions for managing customer shipping addresses
 */

/**
 * Fetch all addresses for a user
 * @param {string} userId - User ID
 * @returns {Object} Result with addresses array
 */
export async function fetchUserAddresses(userId) {
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    // Convert snake_case to camelCase
    const addresses = data.map(address => ({
      id: address.id,
      userId: address.user_id,
      label: address.label,
      fullName: address.full_name,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      phone: address.phone,
      isDefault: address.is_default,
      createdAt: address.created_at,
      updatedAt: address.updated_at
    }))

    return { success: true, data: addresses }
  } catch (error) {
    logger.error('Error fetching user addresses:', error)
    return { success: false, error, data: [] }
  }
}

/**
 * Get the default address for a user
 * @param {string} userId - User ID
 * @returns {Object} Result with default address
 */
export async function getDefaultAddress(userId) {
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No default address found
        return { success: true, data: null }
      }
      throw error
    }

    // Convert snake_case to camelCase
    const address = {
      id: data.id,
      userId: data.user_id,
      label: data.label,
      fullName: data.full_name,
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      country: data.country,
      phone: data.phone,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return { success: true, data: address }
  } catch (error) {
    logger.error('Error fetching default address:', error)
    return { success: false, error, data: null }
  }
}

/**
 * Create a new address
 * @param {Object} addressData - Address data (camelCase)
 * @param {string} addressData.userId - User ID
 * @param {string} addressData.label - Address label
 * @param {string} addressData.fullName - Full name
 * @param {string} addressData.addressLine1 - Address line 1
 * @param {string} addressData.addressLine2 - Address line 2 (optional)
 * @param {string} addressData.city - City
 * @param {string} addressData.state - State
 * @param {string} addressData.postalCode - Postal code
 * @param {string} addressData.country - Country
 * @param {string} addressData.phone - Phone (optional)
 * @param {boolean} addressData.isDefault - Is default address
 * @returns {Object} Result with created address
 */
export async function createAddress(addressData) {
  try {
    // Convert camelCase to snake_case for database
    const dbData = {
      user_id: addressData.userId,
      label: addressData.label,
      full_name: addressData.fullName,
      address_line1: addressData.addressLine1,
      address_line2: addressData.addressLine2 || null,
      city: addressData.city,
      state: addressData.state,
      postal_code: addressData.postalCode,
      country: addressData.country,
      phone: addressData.phone || null,
      is_default: addressData.isDefault || false
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .insert(dbData)
      .select()
      .single()

    if (error) throw error

    // Convert back to camelCase
    const address = {
      id: data.id,
      userId: data.user_id,
      label: data.label,
      fullName: data.full_name,
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      country: data.country,
      phone: data.phone,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return { success: true, data: address }
  } catch (error) {
    logger.error('Error creating address:', error)
    return { success: false, error, message: error.message }
  }
}

/**
 * Update an existing address
 * @param {string} addressId - Address ID
 * @param {Object} updates - Fields to update (camelCase)
 * @returns {Object} Result with updated address
 */
export async function updateAddress(addressId, updates) {
  try {
    // Convert camelCase to snake_case
    const dbUpdates = {}
    if (updates.label !== undefined) dbUpdates.label = updates.label
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName
    if (updates.addressLine1 !== undefined) dbUpdates.address_line1 = updates.addressLine1
    if (updates.addressLine2 !== undefined) dbUpdates.address_line2 = updates.addressLine2
    if (updates.city !== undefined) dbUpdates.city = updates.city
    if (updates.state !== undefined) dbUpdates.state = updates.state
    if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode
    if (updates.country !== undefined) dbUpdates.country = updates.country
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault

    const { data, error } = await supabase
      .from('customer_addresses')
      .update(dbUpdates)
      .eq('id', addressId)
      .select()
      .single()

    if (error) throw error

    // Convert back to camelCase
    const address = {
      id: data.id,
      userId: data.user_id,
      label: data.label,
      fullName: data.full_name,
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      country: data.country,
      phone: data.phone,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return { success: true, data: address }
  } catch (error) {
    logger.error('Error updating address:', error)
    return { success: false, error, message: error.message }
  }
}

/**
 * Delete an address
 * @param {string} addressId - Address ID
 * @returns {Object} Result object
 */
export async function deleteAddress(addressId) {
  try {
    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    logger.error('Error deleting address:', error)
    return { success: false, error, message: error.message }
  }
}

/**
 * Set an address as default (unsets all others for the user)
 * @param {string} addressId - Address ID
 * @param {string} userId - User ID
 * @returns {Object} Result object
 */
export async function setDefaultAddress(addressId, userId) {
  try {
    // The database trigger will handle unsetting other addresses
    const { data, error} = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Convert back to camelCase
    const address = {
      id: data.id,
      userId: data.user_id,
      label: data.label,
      fullName: data.full_name,
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      country: data.country,
      phone: data.phone,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return { success: true, data: address }
  } catch (error) {
    logger.error('Error setting default address:', error)
    return { success: false, error, message: error.message }
  }
}
