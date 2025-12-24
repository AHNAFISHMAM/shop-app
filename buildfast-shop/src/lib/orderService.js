/**
 * Order Service
 *
 * Service layer for order-related operations.
 * Abstracts Supabase RPC calls and direct queries for orders.
 */

import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Create order with items using RPC function (atomic transaction)
 *
 * This is the recommended way to create orders as it:
 * - Validates prices on server-side (security)
 * - Creates order and items atomically (all or nothing)
 * - Calculates totals on server (prevents manipulation)
 * - Checks stock availability before creating order
 *
 * @param {Object} orderData - Order details
 * @param {string|null} orderData.userId - User ID (null for guests)
 * @param {string} orderData.customerEmail - Customer email
 * @param {string} orderData.customerName - Customer name
 * @param {Object} orderData.shippingAddress - Shipping address (JSONB)
 * @param {Array} orderData.items - Array of order items
 * @param {string|null} orderData.items[].menu_item_id - New menu catalog item ID
 * @param {string|null} orderData.items[].product_id - Legacy dishes ID (deprecated)
 * @param {number} orderData.items[].quantity - Quantity
 * @param {number} orderData.items[].price_at_purchase - Price at time of purchase
 * @param {string|null} orderData.discountCodeId - Optional discount code ID
 * @param {number} orderData.discountAmount - Discount amount (default: 0)
 * @param {string|null} orderData.guestSessionId - Guest session ID when user is not authenticated
 * @param {boolean} orderData.isGuest - Explicit guest flag (optional)
 * @returns {Promise<{success: boolean, orderId: string|null, error: string|null}>}
 */
export async function createOrderWithItems(orderData) {
  try {
    const {
      userId,
      customerEmail,
      customerName,
      shippingAddress,
      items,
      discountCodeId = null,
      discountAmount = 0,
      guestSessionId = null,
      isGuest = null,
    } = orderData

    // Validate required fields
    if (!customerEmail || customerEmail.trim() === '') {
      return {
        success: false,
        orderId: null,
        error: 'Customer email is required',
      }
    }

    if (!customerName || customerName.trim() === '') {
      return {
        success: false,
        orderId: null,
        error: 'Customer name is required',
      }
    }

    if (!shippingAddress) {
      return {
        success: false,
        orderId: null,
        error: 'Shipping address is required',
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        success: false,
        orderId: null,
        error: 'Order must contain at least one item',
      }
    }

    const sanitizedItems = []

    // Validate each item
    for (const item of items) {
      const itemMenuItemId = item.menu_item_id || null
      const itemProductId = item.product_id || null
      const itemVariantId = item.variant_id || item.variantId || null
      const itemCombinationId = item.combination_id || item.combinationId || null

      let variantMetadata = item.variant_metadata || item.variantMetadata || null
      if (!variantMetadata && item.variant_snapshot) {
        variantMetadata = item.variant_snapshot
      } else if (!variantMetadata && item.variant_display) {
        variantMetadata = { display: item.variant_display }
      }

      if (variantMetadata && typeof variantMetadata === 'string') {
        try {
          variantMetadata = JSON.parse(variantMetadata)
        } catch {
          variantMetadata = { display: variantMetadata }
        }
      }

      if (!itemMenuItemId && !itemProductId) {
        return {
          success: false,
          orderId: null,
          error: 'Each item must have a menu_item_id or product_id',
        }
      }

      if (!item.quantity || item.quantity <= 0) {
        return {
          success: false,
          orderId: null,
          error: 'Each item must have a valid quantity',
        }
      }

      if (!item.price_at_purchase || item.price_at_purchase <= 0) {
        return {
          success: false,
          orderId: null,
          error: 'Each item must have a valid price',
        }
      }

      sanitizedItems.push({
        product_id: itemProductId,
        menu_item_id: itemMenuItemId,
        quantity: item.quantity,
        price_at_purchase: Number(item.price_at_purchase),
        variant_id: itemVariantId,
        combination_id: itemCombinationId,
        variant_metadata: variantMetadata,
      })
    }

    // Call RPC function
    const { data: orderId, error } = await supabase.rpc('create_order_with_items', {
      _user_id: userId || null,
      _customer_email: customerEmail.trim(),
      _customer_name: customerName.trim(),
      _shipping_address: shippingAddress,
      _items: sanitizedItems,
      _subtotal: null, // Let server calculate
      _discount_code_id: discountCodeId,
      _discount_amount: discountAmount || 0,
      _guest_session_id: guestSessionId || null,
      _is_guest: isGuest !== null ? isGuest : !userId,
    })

    if (error) {
      logger.error('Error creating order:', error)

      // Return user-friendly error messages
      if (error.message.includes('not available')) {
        return {
          success: false,
          orderId: null,
          error: 'One or more items are no longer available. Please refresh and try again.',
        }
      }

      if (error.message.includes('Invalid price')) {
        return {
          success: false,
          orderId: null,
          error: 'Invalid product pricing. Please refresh the page and try again.',
        }
      }

      return {
        success: false,
        orderId: null,
        error: error.message || 'Failed to create order',
      }
    }

    return {
      success: true,
      orderId: orderId,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in createOrderWithItems:', err)
    return {
      success: false,
      orderId: null,
      error: 'An unexpected error occurred while creating your order',
    }
  }
}

/**
 * Get user's orders
 *
 * @param {string} userId - User ID
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Limit results
 * @param {string} options.status - Filter by status
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getUserOrders(userId, options = {}) {
  try {
    if (!userId) {
      return {
        success: false,
        data: null,
        error: 'User ID is required',
      }
    }

    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching orders:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load orders',
      }
    }

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getUserOrders:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get guest orders by email and session ID
 *
 * @param {string} email - Guest email
 * @param {string} sessionId - Guest session ID
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getGuestOrders(email, sessionId) {
  try {
    if (!email || !sessionId) {
      return {
        success: false,
        data: null,
        error: 'Email and session ID are required',
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .eq('guest_session_id', sessionId)
      .eq('is_guest', true)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching guest orders:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load orders',
      }
    }

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getGuestOrders:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get order by ID with items
 *
 * @param {string} orderId - Order ID
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function getOrderById(orderId) {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      logger.error('Error fetching order:', orderError)
      return {
        success: false,
        data: null,
        error: orderError.message || 'Order not found',
      }
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(
        `
        *,
        menu_item:menu_item_id (
          id,
          name,
          description,
          price,
          image_url,
          dietary_tags,
          spice_level
        ),
        legacy_dish:product_id (
          id,
          name,
          description,
          images,
          price
        )
      `
      )
      .eq('order_id', orderId)

    if (itemsError) {
      logger.error('Error fetching order items:', itemsError)
      // Return order without items rather than failing completely
      return {
        success: true,
        data: { ...order, items: [] },
        error: null,
      }
    }

    const normalizedItems = (items || []).map(item => {
      const { menu_item, legacy_dish, ...rest } = item
      return {
        ...rest,
        menu_items: menu_item ?? null,
        dishes: legacy_dish ?? null,
        resolvedProduct: menu_item ?? legacy_dish ?? null,
      }
    })

    return {
      success: true,
      data: {
        ...order,
        items: normalizedItems,
      },
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getOrderById:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Admin: Get all orders with filters
 *
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.startDate - Filter from date
 * @param {string} filters.endDate - Filter to date
 * @param {number} filters.limit - Limit results
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function getAllOrders(filters = {}) {
  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching all orders:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load orders',
      }
    }

    return {
      success: true,
      data: data || [],
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in getAllOrders:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Admin: Update order status
 *
 * @param {string} orderId - Order ID
 * @param {string} status - New status (pending, processing, shipped, delivered, cancelled)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: 'Invalid status value',
      }
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      logger.error('Error updating order status:', error)
      return {
        success: false,
        error: error.message || 'Failed to update order',
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in updateOrderStatus:', err)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export default {
  createOrderWithItems,
  getUserOrders,
  getGuestOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
}
