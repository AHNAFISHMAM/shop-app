import { supabase } from './supabase'
import { emitCartChanged } from './cartEvents'
import { logger } from '../utils/logger'
import type { CartItem, Database } from './database.types'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

/**
 * Product type (can be menu item or legacy product)
 */
export interface Product {
  id: string
  isMenuItem?: boolean
  category_id?: string | null
  name?: string
  description?: string | null
  price?: number
  image_url?: string | null
  is_available?: boolean
  is_featured?: boolean
  created_at?: string
  updated_at?: string
  stock_quantity?: number
  [key: string]: unknown
}

/**
 * Variant type
 */
export interface Variant {
  id: string
  stock_quantity?: number
  [key: string]: unknown
}

/**
 * Combination type
 */
export interface Combination {
  id: string
  stock_quantity?: number
  [key: string]: unknown
}

/**
 * Cart item result
 */
export interface CartItemResult {
  item: CartItem | null
  error: Error | null
}

/**
 * Cart operation result
 */
export interface CartOperationResult {
  success: boolean
  error: Error | null
  stockExceeded?: boolean
  stockLimit?: number | null
}

/**
 * Check if a product already exists in the user's cart
 * @param userId - User ID
 * @param productId - Product ID
 * @param variantId - Optional variant ID (for single-variant products)
 * @param combinationId - Optional combination ID (for multi-variant products)
 * @returns Promise with existing cart item or error
 */
export const getExistingCartItem = async (
  userId: string,
  productId: string,
  variantId: string | null = null,
  combinationId: string | null = null
): Promise<CartItemResult> => {
  let query = supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)

  // Three cases:
  // 1. Combination (multi-variant): match by combination_id
  // 2. Single variant: match by variant_id
  // 3. No variants: match items without variant_id or combination_id

  if (combinationId) {
    query = query.eq('combination_id', combinationId)
  } else if (variantId) {
    query = query.eq('variant_id', variantId).is('combination_id', null)
  } else {
    query = query.is('variant_id', null).is('combination_id', null)
  }

  const { data, error } = await query.maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return { item: null, error }
  }

  return { item: data ? (data as CartItem) : null, error: null }
}

/**
 * Update cart item quantity
 * @param cartItemId - Cart item ID
 * @param newQuantity - New quantity
 * @param userId - User ID (for security check)
 * @returns Promise with error if any
 */
export const updateCartItemQuantity = async (
  cartItemId: string,
  newQuantity: number,
  userId: string
): Promise<{ error: Error | null }> => {
  const updateData: Database['public']['Tables']['cart_items']['Update'] = {
    quantity: newQuantity,
  }
  const { error } = await (supabase
    .from('cart_items') as any)
    .update(updateData)
    .eq('id', cartItemId)
    .eq('user_id', userId)

  if (!error) {
    emitCartChanged() // Trigger immediate UI update
  }

  return { error }
}

/**
 * Insert a new cart item
 * @param userId - User ID
 * @param productId - Product ID
 * @param variantId - Optional variant ID (for single-variant products)
 * @param combinationId - Optional combination ID (for multi-variant products)
 * @returns Promise with error if any
 */
export const insertCartItem = async (
  userId: string,
  productId: string,
  _variantId: string | null = null,
  _combinationId: string | null = null
): Promise<{ error: Error | null }> => {
  const insertData = {
    user_id: userId,
    product_id: productId,
    quantity: 1,
  } as Database['public']['Tables']['cart_items']['Insert']
  const { error } = await supabase.from('cart_items').insert([insertData] as any)

  if (!error) {
    emitCartChanged() // Trigger immediate UI update
  }

  return { error }
}

/**
 * Add product to cart (handles both insert and update)
 * @param product - Product object
 * @param userId - User ID
 * @param variant - Optional variant object (for single-variant products)
 * @param combination - Optional combination object (for multi-variant products)
 * @returns Promise with operation result
 */
export const addProductToCart = async (
  product: Product,
  userId: string,
  variant: Variant | null = null,
  combination: Combination | null = null
): Promise<CartOperationResult> => {
  const isMenuItem =
    product?.isMenuItem ??
    (product?.category_id !== undefined && product?.is_available !== undefined)

  const productId = product.id
  const variantId = variant?.id || null
  const combinationId = combination?.id || null

  // Check stock availability
  const stockQuantity = isMenuItem
    ? (product as MenuItem).is_available
      ? 999
      : 0
    : variant
      ? variant.is_available !== false
        ? 999
        : 0 // Note: variants may not have stock_quantity
      : combination
        ? combination.is_available !== false
          ? 999
          : 0 // Note: combinations may not have stock_quantity
        : product.is_available !== false
          ? 999
          : 0 // Note: products may not have stock_quantity

  // Check if item already exists in cart
  const { item: existingItem, error: checkError } = await getExistingCartItem(
    userId,
    productId,
    variantId,
    combinationId
  )

  if (checkError) {
    return {
      success: false,
      error: checkError,
      stockExceeded: false,
      stockLimit: null,
    }
  }

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + 1

    // Check stock limit
    if (stockQuantity > 0 && newQuantity > stockQuantity) {
      return {
        success: false,
        error: new Error('Stock limit exceeded'),
        stockExceeded: true,
        stockLimit: stockQuantity,
      }
    }

    const { error } = await updateCartItemQuantity(existingItem.id, newQuantity, userId)
    return {
      success: !error,
      error,
      stockExceeded: false,
      stockLimit: stockQuantity > 0 ? stockQuantity : null,
    }
  } else {
    // Insert new item
    const { error } = await insertCartItem(userId, productId, variantId, combinationId)
    return {
      success: !error,
      error,
      stockExceeded: false,
      stockLimit: stockQuantity > 0 ? stockQuantity : null,
    }
  }
}

/**
 * Get cart count (number of unique items)
 * @param userId - User ID
 * @returns Promise with cart count
 */
export async function getCartCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      logger.error('Error getting cart count:', error)
      return 0
    }

    return count || 0
  } catch (err) {
    logger.error('Unexpected error in getCartCount:', err)
    return 0
  }
}

/**
 * Get total quantity of all items in cart
 * @param userId - User ID
 * @returns Promise with total quantity
 */
export async function getCartTotalQuantity(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', userId)

    if (error) {
      logger.error('Error getting cart total quantity:', error)
      return 0
    }

    return (
      data?.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0) || 0
    )
  } catch (err) {
    logger.error('Unexpected error in getCartTotalQuantity:', err)
    return 0
  }
}

/**
 * Add menu item to cart
 * @param menuItem - Menu item object
 * @param userId - User ID
 * @returns Promise with operation result
 */
export const addMenuItemToCart = async (
  menuItem: MenuItem,
  userId: string
): Promise<CartOperationResult> => {
  try {
    // Check if item already exists in cart
    const { item: existingItem, error: checkError } = await getExistingCartItem(
      userId,
      menuItem.id,
      null,
      null
    )

    if (checkError) {
      return {
        success: false,
        error: checkError,
        stockExceeded: false,
        stockLimit: null,
      }
    }

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + 1
      const { error } = await updateCartItemQuantity(existingItem.id, newQuantity, userId)
      return {
        success: !error,
        error,
        stockExceeded: false,
        stockLimit: null,
      }
    } else {
      // Insert new item (using menu_item_id instead of product_id)
      const insertData = {
        user_id: userId,
        menu_item_id: menuItem.id,
        quantity: 1,
      } as Database['public']['Tables']['cart_items']['Insert']
      const { error } = await supabase.from('cart_items').insert([insertData] as any)

      if (!error) {
        emitCartChanged()
      }

      return {
        success: !error,
        error,
        stockExceeded: false,
        stockLimit: null,
      }
    }
  } catch (err) {
    logger.error('Unexpected error in addMenuItemToCart:', err)
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unexpected error'),
      stockExceeded: false,
      stockLimit: null,
    }
  }
}

/**
 * Update menu item quantity in cart
 * @param cartItemId - Cart item ID
 * @param newQuantity - New quantity
 * @param userId - User ID
 * @returns Promise with error if any
 */
export const updateMenuItemQuantity = async (
  cartItemId: string,
  newQuantity: number,
  userId: string
): Promise<{ error: Error | null }> => {
  const updateData: Database['public']['Tables']['cart_items']['Update'] = {
    quantity: newQuantity,
  }
  const { error } = await (supabase
    .from('cart_items') as any)
    .update(updateData)
    .eq('id', cartItemId)
    .eq('user_id', userId)

  if (!error) {
    emitCartChanged()
  }

  return { error }
}

/**
 * Remove menu item from cart
 * @param cartItemId - Cart item ID
 * @param userId - User ID
 * @returns Promise with error if any
 */
export const removeMenuItemFromCart = async (
  cartItemId: string,
  userId: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('user_id', userId)

  if (!error) {
    emitCartChanged()
  }

  return { error }
}

/**
 * Get cart with menu items joined
 * @param userId - User ID
 * @returns Promise with cart items with menu item data
 */
export const getCartWithMenuItems = async (
  userId: string
): Promise<{
  data: Array<CartItem & { menu_items: MenuItem }> | null
  error: Error | null
}> => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      `
      *,
      menu_items (*)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return {
    data: (data as Array<CartItem & { menu_items: MenuItem }>) || null,
    error,
  }
}
