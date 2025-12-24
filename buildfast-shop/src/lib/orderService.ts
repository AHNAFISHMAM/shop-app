/**
 * Order Service
 *
 * Service layer for order-related operations.
 * Abstracts Supabase RPC calls and direct queries for orders.
 */

import { supabase } from './supabase'
import { logger } from '../utils/logger'
import type { Order, CreateOrderResult, Database } from './database.types'

/**
 * Order item input type
 */
export interface OrderItemInput {
  menu_item_id?: string | null
  product_id?: string | null
  variant_id?: string | null
  combination_id?: string | null
  variant_metadata?: Record<string, unknown> | null
  variant_snapshot?: Record<string, unknown> | null
  variant_display?: string | null
  variantId?: string | null
  combinationId?: string | null
  variantMetadata?: Record<string, unknown> | null
  quantity: number
  price_at_purchase: number
}

/**
 * Shipping address type
 */
export interface ShippingAddress {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  [key: string]: unknown
}

/**
 * Order creation data
 */
export interface OrderData {
  userId: string | null
  customerEmail: string
  customerName: string
  shippingAddress: ShippingAddress
  items: OrderItemInput[]
  discountCodeId?: string | null
  discountAmount?: number
  guestSessionId?: string | null
  isGuest?: boolean | null
}

/**
 * Order response type
 */
export interface OrderResponse {
  success: boolean
  orderId: string | null
  error: string | null
}

/**
 * Orders response type
 */
export interface OrdersResponse {
  success: boolean
  data: Order[] | null
  error: string | null
}

/**
 * Order query options
 */
export interface OrderQueryOptions {
  limit?: number
  status?: string
}

/**
 * Order filters
 */
export interface OrderFilters {
  status?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

/**
 * Create order with items using RPC function (atomic transaction)
 *
 * This is the recommended way to create orders as it:
 * - Validates prices on server-side (security)
 * - Creates order and items atomically (all or nothing)
 * - Calculates totals on server (prevents manipulation)
 * - Checks stock availability before creating order
 *
 * @param orderData - Order details
 * @returns Promise with order ID or error
 */
export async function createOrderWithItems(orderData: OrderData): Promise<OrderResponse> {
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

    const sanitizedItems: Array<{
      product_id: string | null
      menu_item_id: string | null
      quantity: number
      price_at_purchase: number
      variant_id: string | null
      combination_id: string | null
      variant_metadata: Record<string, unknown> | null
    }> = []

    // Validate each item
    for (const item of items) {
      const itemMenuItemId = item.menu_item_id || null
      const itemProductId = item.product_id || null
      const itemVariantId = item.variant_id || item.variantId || null
      const itemCombinationId = item.combination_id || item.combinationId || null

      let variantMetadata: Record<string, unknown> | null =
        item.variant_metadata || item.variantMetadata || null
      if (!variantMetadata && item.variant_snapshot) {
        variantMetadata = item.variant_snapshot
      } else if (!variantMetadata && item.variant_display) {
        variantMetadata = { display: item.variant_display }
      }

      if (variantMetadata && typeof variantMetadata === 'string') {
        try {
          variantMetadata = JSON.parse(variantMetadata) as Record<string, unknown>
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
    const { data, error } = await supabase.rpc('create_order_with_items', {
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

    const result = data as CreateOrderResult

    return {
      success: result.success,
      orderId: result.order_id,
      error: result.error,
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
 * @param userId - User ID
 * @param options - Optional parameters
 * @returns Promise with orders data or error
 */
export async function getUserOrders(
  userId: string,
  options: OrderQueryOptions = {}
): Promise<OrdersResponse> {
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
      data: (data as Order[]) || [],
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
 * @param email - Guest email
 * @param sessionId - Guest session ID
 * @returns Promise with orders data or error
 */
export async function getGuestOrders(email: string, sessionId: string): Promise<OrdersResponse> {
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
      data: (data as Order[]) || [],
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
 * Get order by ID
 *
 * @param orderId - Order ID
 * @returns Promise with order data or error
 */
export async function getOrderById(orderId: string): Promise<{
  success: boolean
  data: Order | null
  error: string | null
}> {
  try {
    if (!orderId) {
      return {
        success: false,
        data: null,
        error: 'Order ID is required',
      }
    }

    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single()

    if (error) {
      logger.error('Error fetching order:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load order',
      }
    }

    return {
      success: true,
      data: data as Order,
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
 * Get all orders (admin only)
 *
 * @param filters - Optional filters
 * @returns Promise with orders data or error
 */
export async function getAllOrders(
  filters: OrderFilters = {}
): Promise<OrdersResponse & { count?: number }> {
  try {
    // Optimize: Only select needed fields instead of *
    let query = supabase
      .from('orders')
      .select('id, status, order_total, created_at, customer_email, customer_name, user_id', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Apply pagination
    if (filters.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching orders:', error)
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to load orders',
        count: 0,
      }
    }

    return {
      success: true,
      data: (data as Order[]) || [],
      error: null,
      count: count || 0,
    }
  } catch (err) {
    logger.error('Unexpected error in getAllOrders:', err)
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
      count: 0,
    }
  }
}

/**
 * Update order status
 *
 * @param orderId - Order ID
 * @param status - New status
 * @returns Promise with success status or error
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<OrderResponse> {
  try {
    if (!orderId || !status) {
      return {
        success: false,
        orderId: null,
        error: 'Order ID and status are required',
      }
    }

    const updateData = { status } as Database['public']['Tables']['orders']['Update']
    const { data, error } = await supabase
      .from('orders')
      .update(updateData as never)
      .eq('id', orderId)
      .select('id')
      .single()

    if (error) {
      logger.error('Error updating order status:', error)
      return {
        success: false,
        orderId: null,
        error: error.message || 'Failed to update order status',
      }
    }

    return {
      success: true,
      orderId: data?.id || null,
      error: null,
    }
  } catch (err) {
    logger.error('Unexpected error in updateOrderStatus:', err)
    return {
      success: false,
      orderId: null,
      error: 'An unexpected error occurred',
    }
  }
}

// Export createOrder as alias for createOrderWithItems
export const createOrder = createOrderWithItems

export default {
  createOrderWithItems,
  createOrder,
  getUserOrders,
  getGuestOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
}
