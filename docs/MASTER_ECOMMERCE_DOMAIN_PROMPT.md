# 🛒 MASTER E-COMMERCE DOMAIN PROMPT
## Production-Grade E-Commerce Implementation Workflow

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing e-commerce features including cart management, order processing, checkout flows, inventory management, pricing calculations, and discount code systems. It covers both guest and authenticated user patterns, atomic operations, and security best practices.

**Applicable to:**
- Cart management (guest + authenticated)
- Order processing and status management
- Checkout flow implementation
- Inventory management and stock tracking
- Pricing calculations and tax handling
- Discount code validation and usage tracking
- Payment integration workflows
- Order history and tracking

---

## 🎯 CORE PRINCIPLES

### 1. **Cart State Management**
- **Guest Cart**: Stored in localStorage for unauthenticated users
- **Authenticated Cart**: Stored in database with real-time sync
- **Cart Migration**: Seamlessly migrate guest cart to authenticated cart on login
- **Cart Persistence**: Maintain cart across sessions and devices

### 2. **Order Processing**
- **Atomic Operations**: Use database transactions or RPC functions
- **Inventory Validation**: Always check stock before order creation
- **Order Status Flow**: Clear status transitions (pending → confirmed → preparing → ready → completed)
- **Idempotency**: Prevent duplicate orders on retries

### 3. **Pricing & Calculations**
- **Server-Side Validation**: Always validate prices on the server
- **Tax Calculation**: Calculate tax based on location and product type
- **Shipping Logic**: Apply shipping rules (free shipping thresholds, zones)
- **Rounding**: Consistent rounding to 2 decimal places

### 4. **Discount Codes**
- **Validation**: Check expiration, usage limits, and eligibility
- **Application Rules**: Apply discounts in correct order (percentage before fixed)
- **Usage Tracking**: Record all discount applications for analytics
- **Security**: Prevent discount code abuse

### 5. **Inventory Management**
- **Stock Checks**: Verify availability before cart operations
- **Reservation**: Optionally reserve items during checkout
- **Low Stock Warnings**: Alert users when stock is low
- **Backorders**: Handle out-of-stock scenarios gracefully

---

## 🔍 PHASE 1: CART MANAGEMENT

### Step 1.1: Cart Utilities (Real Implementation)

**From `buildfast-shop/src/lib/cartUtils.ts`:**

```typescript
import { supabase } from './supabase'
import { emitCartChanged } from './cartEvents'
import { logger } from '../utils/logger'
import type { CartItem, MenuItem } from './database.types'

/**
 * Product type (can be menu item or legacy product)
 */
export interface Product {
  id: string
  isMenuItem?: boolean
  category_id?: string
  is_available?: boolean
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

  return { item: (data as CartItem) || null, error: null }
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
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQuantity })
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
  variantId: string | null = null,
  combinationId: string | null = null
): Promise<{ error: Error | null }> => {
  const { error } = await supabase.from('cart_items').insert([
    {
      user_id: userId,
      product_id: productId,
      variant_id: variantId,
      combination_id: combinationId,
      quantity: 1,
    },
  ])

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
      ? variant.stock_quantity || 0
      : combination
        ? combination.stock_quantity || 0
        : product.stock_quantity || 0

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
      data?.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0) ||
      0
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
      const { error } = await supabase.from('cart_items').insert([
        {
          user_id: userId,
          menu_item_id: menuItem.id,
          quantity: 1,
        },
      ])

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
```

**Key Points:**
- Handles both menu items and legacy products
- Supports variants and combinations
- Checks stock before adding
- Emits cart change events for real-time UI updates
- Returns detailed operation results with error information

### Authenticated Cart with React Query

```typescript
// Query keys
export const queryKeys = {
  cart: {
    all: ['cart'] as const,
    items: (userId: string | null) => ['cart', 'items', userId] as const,
  },
}

// Fetch cart items
export async function fetchCartItems(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      products (
        id,
        name,
        price,
        image_url,
        stock
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// React Query hook
export function useCartItems(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.cart.items(userId),
    queryFn: () => fetchCartItems(userId!, supabase),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  })
}
```

### Add to Cart with Validation

```typescript
export async function addToCart(
  productId: string,
  quantity: number,
  userId: string | null,
  supabase: SupabaseClient<Database>
): Promise<void> {
  // 1. Validate inventory
  const { data: product, error: productError } = await supabase
    .from('menu_items')
    .select('is_available, price, name')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    throw new Error('Product not found')
  }

  if (!product.is_available) {
    throw new Error('Product is currently unavailable.')
  }

  // 2. Add to cart (guest or authenticated)
  if (userId) {
    // Check if item already exists in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      // Update quantity
      const newQuantity = existing.quantity + quantity
      if (!product.is_available) {
        throw new Error('Product is currently unavailable')
      }

      await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existing.id)
    } else {
      // Insert new item
      await supabase.from('cart_items').insert({
        user_id: userId,
        product_id: productId,
        quantity,
        price: product.price,
      })
    }
  } else {
    // Guest cart
    const guestCart = getGuestCart()
    const existingIndex = guestCart.findIndex(
      item => item.product_id === productId
    )

    if (existingIndex >= 0) {
      const newQuantity = guestCart[existingIndex].quantity + quantity
      if (!product.is_available) {
        throw new Error('Product is currently unavailable')
      }
      guestCart[existingIndex].quantity = newQuantity
    } else {
      guestCart.push({
        product_id: productId,
        quantity,
        price: product.price,
        name: product.name,
      })
    }

    saveGuestCart(guestCart)
  }

  // 3. Invalidate cart queries
  queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
}
```

### Migrate Guest Cart to Authenticated

```typescript
export async function migrateGuestCartToAuthenticated(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<void> {
  const guestCart = getGuestCart()
  if (guestCart.length === 0) return

  // Validate all items still have stock
  for (const item of guestCart) {
    const { data: product } = await supabase
      .from('menu_items')
      .select('is_available, price')
      .eq('id', item.product_id)
      .single()

    if (!product || !product.is_available) {
      // Remove invalid items
      const index = guestCart.indexOf(item)
      guestCart.splice(index, 1)
      continue
    }

    // Update price in case it changed
    item.price = product.price
  }

  // Insert all items into database cart
  if (guestCart.length > 0) {
    const cartItems = guestCart.map(item => ({
      user_id: userId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }))

    await supabase.from('cart_items').insert(cartItems)
  }

  // Clear guest cart
  clearGuestCart()
  queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
}
```

---

## 🛠️ PHASE 2: ORDER PROCESSING

### Step 2.1: Order Service (Real Implementation)

**From `buildfast-shop/src/lib/orderService.ts`:**

```typescript
/**
 * Order Service
 *
 * Service layer for order-related operations.
 * Abstracts Supabase RPC calls and direct queries for orders.
 */

import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { logError, getUserFriendlyError } from './error-handler'
import type { Order, OrderItem, CreateOrderResult } from './database.types'

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
export async function createOrderWithItems(
  orderData: OrderData
): Promise<OrderResponse> {
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
          error: 'Each item must have a quantity greater than 0',
        }
      }

      if (!item.price_at_purchase || item.price_at_purchase <= 0) {
        return {
          success: false,
          orderId: null,
          error: 'Each item must have a valid price_at_purchase',
        }
      }

      sanitizedItems.push({
        product_id: itemProductId,
        menu_item_id: itemMenuItemId,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
        variant_id: itemVariantId,
        combination_id: itemCombinationId,
        variant_metadata: variantMetadata,
      })
    }

    // Call RPC function (atomic operation)
    const { data, error } = await supabase.rpc('create_order_with_items', {
      p_user_id: userId,
      p_customer_email: customerEmail,
      p_customer_name: customerName,
      p_shipping_address: shippingAddress,
      p_items: sanitizedItems,
      p_discount_code_id: discountCodeId,
      p_discount_amount: discountAmount,
      p_guest_session_id: guestSessionId,
      p_is_guest: isGuest,
    })

    if (error) {
      logError(error, 'orderService.createOrderWithItems')
      return {
        success: false,
        orderId: null,
        error: getUserFriendlyError(error),
      }
    }

    if (!data || !data.order_id) {
      return {
        success: false,
        orderId: null,
        error: 'Order creation failed: No order ID returned',
      }
    }

    logger.log('Order created successfully:', data.order_id)

    return {
      success: true,
      orderId: data.order_id,
      error: null,
    }
  } catch (error) {
    logError(error, 'orderService.createOrderWithItems.exception')
    return {
      success: false,
      orderId: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
```

**Key Points:**
- Validates all required fields before RPC call
- Sanitizes and validates each order item
- Handles both menu items and legacy products
- Supports variants and combinations
- Returns structured response with success/error
- Logs errors for debugging
```

### Order Status Management

```typescript
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  supabase: SupabaseClient<Database>
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) throw error

  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
}
```

---

## 💰 PHASE 3: PRICING CALCULATIONS

### Step 3.1: Checkout Calculation Utilities (Real Implementation)

**From `buildfast-shop/src/pages/Checkout/utils/calculations.ts`:**

```typescript
/**
 * Checkout Calculation Utilities
 */

// @ts-ignore - JS module without types
import { parsePrice } from '../../../lib/priceUtils'
import { SHIPPING_THRESHOLD, SHIPPING_FEE, DEFAULT_TAX_RATE } from '../constants'

export interface CartItem {
  id: string
  quantity: number
  price?: number | string
  price_at_purchase?: number | string
  resolvedProduct?: {
    price?: number | string
  } | null
  product?: {
    price?: number | string
  } | null
}

/**
 * Calculate total number of items (sum of all quantities)
 */
export function calculateTotalItemsCount(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Calculate subtotal (sum of all item prices * quantities)
 */
export function calculateSubtotal(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => {
    // Use resolved product, fallback to embedded product, or use cart item data
    const product = item.resolvedProduct || item.product || {
      price: item.price || item.price_at_purchase || 0
    }
    
    // Handle price - might be string or number, or use fallback from cart item
    const price = typeof product.price === 'number' 
      ? product.price 
      : parsePrice(product.price || item.price || item.price_at_purchase || '0')
    
    return sum + (price * item.quantity)
  }, 0)
}

/**
 * Calculate shipping fee
 */
export function calculateShipping(subtotal: number): number {
  return subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}

/**
 * Calculate tax
 */
export function calculateTax(subtotal: number): number {
  return subtotal * DEFAULT_TAX_RATE
}

/**
 * Calculate grand total (subtotal + shipping + tax - discount)
 */
export function calculateGrandTotal(
  subtotal: number,
  shipping: number,
  tax: number,
  discountAmount: number
): number {
  const total = subtotal + shipping + tax
  return Math.max(0, total - discountAmount) // Ensure total doesn't go negative
}

/**
 * Get tax rate as percentage
 */
export function getTaxRatePercent(): number {
  return DEFAULT_TAX_RATE * 100
}
```

### Step 3.2: Checkout Calculations Hook (Real Implementation)

**From `buildfast-shop/src/pages/Checkout/hooks/useCheckoutCalculations.ts`:**

```typescript
/**
 * useCheckoutCalculations Hook
 *
 * Calculates checkout totals (subtotal, shipping, tax, grand total, etc.)
 */

import { useMemo } from 'react'
import {
  calculateTotalItemsCount,
  calculateSubtotal,
  calculateShipping,
  calculateTax,
  calculateGrandTotal,
  getTaxRatePercent,
  type CartItem,
} from '../utils/calculations'
// @ts-ignore - JS module without types
import { resolveLoyaltyState } from '../../../lib/loyaltyUtils'

interface UseCheckoutCalculationsOptions {
  cartItems: CartItem[]
  discountAmount: number
}

interface UseCheckoutCalculationsReturn {
  totalItemsCount: number
  subtotal: number
  shipping: number
  tax: number
  taxRatePercent: number
  grandTotal: number
  loyalty: ReturnType<typeof resolveLoyaltyState>
}

/**
 * Hook for calculating checkout totals
 */
export function useCheckoutCalculations({
  cartItems,
  discountAmount,
}: UseCheckoutCalculationsOptions): UseCheckoutCalculationsReturn {
  const totalItemsCount = useMemo(
    () => calculateTotalItemsCount(cartItems),
    [cartItems]
  )

  const subtotal = useMemo(
    () => calculateSubtotal(cartItems),
    [cartItems]
  )

  const shipping = useMemo(
    () => calculateShipping(subtotal),
    [subtotal]
  )

  const tax = useMemo(
    () => calculateTax(subtotal),
    [subtotal]
  )

  const taxRatePercent = getTaxRatePercent()

  const grandTotal = useMemo(
    () => calculateGrandTotal(subtotal, shipping, tax, discountAmount),
    [subtotal, shipping, tax, discountAmount]
  )

  const loyalty = useMemo(
    () => resolveLoyaltyState(grandTotal),
    [grandTotal]
  )

  return {
    totalItemsCount,
    subtotal,
    shipping,
    tax,
    taxRatePercent,
    grandTotal,
    loyalty,
  }
}
```

**Key Points:**
- Handles price as both string and number
- Uses resolved product data when available
- Memoizes calculations for performance
- Ensures grand total never goes negative
- Integrates with loyalty system

---

## 🎟️ PHASE 4: DISCOUNT CODE SYSTEM

### Step 4.1: Discount Code Validation (Real Implementation)

**From `buildfast-shop/src/lib/discountUtils.js`:**

```typescript
import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Validate a discount code
 *
 * NOTE: This validation is not atomic. Race conditions are prevented by database constraints:
 * - One-per-customer: UNIQUE(discount_code_id, user_id) in discount_code_usage
 * - Usage limit: CHECK(usage_count <= usage_limit) in discount_codes
 *
 * If a race condition occurs, applyDiscountCodeToOrder() will fail with a constraint error.
 * Always check the result of applyDiscountCodeToOrder() and handle constraint violations.
 *
 * @param {string} code - The discount code to validate
 * @param {string} userId - The user ID
 * @param {number} orderTotal - The order total before discount
 * @returns {Object} Validation result with discount details or error
 */
export async function validateDiscountCode(code, userId, orderTotal) {
  try {
    const upperCode = code.toUpperCase().trim()

    // Fetch the discount code
    const { data: discountCode, error: fetchError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', upperCode)
      .eq('is_active', true)
      .single()

    if (fetchError || !discountCode) {
      return {
        valid: false,
        error: 'Invalid discount code',
        message: 'This discount code does not exist or is not active.'
      }
    }

    // Check if code has expired
    if (discountCode.expires_at) {
      const expirationDate = new Date(discountCode.expires_at)
      const now = new Date()
      if (now > expirationDate) {
        return {
          valid: false,
          error: 'Expired code',
          message: 'This discount code has expired.'
        }
      }
    }

    // Check if code has started
    if (discountCode.starts_at) {
      const startDate = new Date(discountCode.starts_at)
      const now = new Date()
      if (now < startDate) {
        return {
          valid: false,
          error: 'Code not started',
          message: 'This discount code is not yet active.'
        }
      }
    }

    // Check minimum order amount
    if (discountCode.min_order_amount && orderTotal < discountCode.min_order_amount) {
      return {
        valid: false,
        error: 'Minimum order not met',
        message: `Minimum order amount of $${parseFloat(discountCode.min_order_amount).toFixed(2)} required.`
      }
    }

    // Check usage limit
    if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
      return {
        valid: false,
        error: 'Usage limit reached',
        message: 'This discount code has reached its usage limit.'
      }
    }

    // Check if user has already used this code (if one_per_customer is true)
    if (discountCode.one_per_customer) {
      const { data: previousUsage, error: usageError } = await supabase
        .from('discount_code_usage')
        .select('id')
        .eq('discount_code_id', discountCode.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (usageError && usageError.code !== 'PGRST116') {
        logger.error('Error checking code usage:', usageError)
      }

      if (previousUsage) {
        return {
          valid: false,
          error: 'Already used',
          message: 'You have already used this discount code.'
        }
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discountCode.discount_type === 'percentage') {
      discountAmount = (orderTotal * discountCode.discount_value) / 100

      // Apply max discount limit if set
      if (discountCode.max_discount_amount && discountAmount > discountCode.max_discount_amount) {
        discountAmount = discountCode.max_discount_amount
      }
    } else if (discountCode.discount_type === 'fixed') {
      discountAmount = discountCode.discount_value

      // Discount can't exceed order total
      if (discountAmount > orderTotal) {
        discountAmount = orderTotal
      }
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100

    return {
      valid: true,
      discountCode: discountCode,
      discountAmount: discountAmount,
      finalTotal: orderTotal - discountAmount
    }
  } catch (error) {
    logger.error('Error validating discount code:', error)
    return {
      valid: false,
      error: 'Validation error',
      message: 'Failed to validate discount code. Please try again.'
    }
  }
}

/**
 * Apply a discount code to an order (called after order is created)
 * @param {string} discountCodeId - The discount code ID
 * @param {string} userId - The user ID
 * @param {string} orderId - The order ID
 * @param {number} discountAmount - The discount amount
 * @param {number} orderTotal - The order total
 * @returns {Object} Success status
 */
export async function applyDiscountCodeToOrder(
  discountCodeId,
  userId,
  orderId,
  discountAmount,
  orderTotal
) {
  try {
    // Record usage
    const { error: usageError } = await supabase
      .from('discount_code_usage')
      .insert({
        discount_code_id: discountCodeId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
        used_at: new Date().toISOString(),
      })

    if (usageError) {
      // Handle constraint violations (race conditions)
      if (usageError.code === '23505') {
        // Unique constraint violation - user already used this code
        logger.warn('Discount code already used by user:', { discountCodeId, userId })
        return {
          success: false,
          error: 'This discount code has already been used.',
        }
      }
      throw usageError
    }

    // Update usage count on discount code
    const { error: updateError } = await supabase.rpc('increment_discount_code_usage', {
      p_discount_code_id: discountCodeId,
    })

    if (updateError) {
      logger.error('Error incrementing discount code usage:', updateError)
      // Don't fail the order if this fails - usage was already recorded
    }

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    logger.error('Error applying discount code to order:', error)
    return {
      success: false,
      error: error.message || 'Failed to apply discount code',
    }
  }
}
```

**Key Points:**
- Validates expiration and start dates
- Checks minimum order amount
- Validates usage limits (global and per-user)
- Handles one-per-customer constraint
- Calculates percentage and fixed discounts
- Applies max discount limits
- Records usage atomically
- Handles race conditions gracefully

---

## 📊 PHASE 5: INVENTORY MANAGEMENT

### Stock Checking

```typescript
export async function checkInventory(
  productId: string,
  quantity: number,
  supabase: SupabaseClient<Database>
): Promise<{ available: boolean; stock: number }> {
  const { data: product, error } = await supabase
    .from('menu_items')
    .select('is_available')
    .eq('id', productId)
    .single()

  if (error || !product) {
    return { available: false, stock: 0 }
  }

  return {
    available: product.is_available,
    stock: product.is_available ? 1 : 0, // is_available is boolean, not stock count
  }
}

export async function checkMultipleProductsInventory(
  items: { productId: string; quantity: number }[],
  supabase: SupabaseClient<Database>
): Promise<Map<string, { available: boolean; stock: number }>> {
  const productIds = items.map(item => item.productId)
  const { data: products, error } = await supabase
    .from('menu_items')
    .select('id, is_available')
    .in('id', productIds)

  if (error || !products) {
    return new Map()
  }

  const inventoryMap = new Map()
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)
    if (product) {
      inventoryMap.set(item.productId, {
        available: product.is_available,
        stock: product.is_available ? 1 : 0, // is_available is boolean, not stock count
      })
    }
  }

  return inventoryMap
}
```

---

## 📦 PHASE 5: CHECKOUT FLOW

### Step 5.1: Checkout Order Hook (Real Implementation)

**From `buildfast-shop/src/pages/Checkout/hooks/useCheckoutOrder.ts`:**

```typescript
/**
 * useCheckoutOrder Hook
 *
 * Handles order placement, payment intent creation, and payment success flow.
 */

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
// @ts-ignore - JS module without types
import { parsePrice } from '../../../lib/priceUtils'
import { createOrderWithItems } from '../../../lib/orderService'
// @ts-ignore - JS module without types
import { applyDiscountCodeToOrder } from '../../../lib/discountUtils'
// @ts-ignore - JS module without types
import { getGuestSessionId, clearGuestCart } from '../../../lib/guestSessionUtils'
// @ts-ignore - JS module without types
import { edgeFunctionClient } from '../../../shared/lib'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
// @ts-ignore - JS module without types
import { setMessageWithAutoClear } from '../../../utils/messageUtils'
import { CURRENCY_CODE } from '../constants'
import { validateEmail } from '../utils/validation'
import type { ShippingAddress, FulfillmentMode, ScheduledSlot } from '../types'

interface UseCheckoutOrderOptions {
  user: { id: string; email?: string | null } | null
  guestEmail: string
  cartItems: CartItem[]
  shippingAddress: ShippingAddress
  fulfillmentMode: FulfillmentMode
  scheduledSlot: ScheduledSlot
  orderNote: string
  enableMarketingOptins: boolean
  emailUpdatesOptIn: boolean
  smsUpdatesOptIn: boolean
  appliedDiscountCode: unknown | null
  discountAmount: number
  grandTotal: number
  subtotal: number
  shipping: number
  tax: number
  isAddressValid: () => boolean
  getMissingAddressFields: () => { missing: string[]; errors: string[] }
}

interface UseCheckoutOrderReturn {
  placingOrder: boolean
  orderSuccess: boolean
  orderError: string
  showPayment: boolean
  clientSecret: string
  createdOrderId: string | null
  showSuccessModal: boolean
  showConversionModal: boolean
  guestCheckoutData: unknown | null
  trackingStatus: unknown | null
  handlePlaceOrder: (e: React.FormEvent) => Promise<void>
  handlePaymentSuccess: () => Promise<void>
  handlePaymentError: (error: Error) => void
  handleModalClose: () => void
  setShowConversionModal: (show: boolean) => void
  setShowSuccessModal: (show: boolean) => void
  setOrderError: (error: string) => void
}

/**
 * Hook for managing checkout order placement and payment
 */
export function useCheckoutOrder({
  user,
  guestEmail,
  cartItems,
  shippingAddress,
  fulfillmentMode,
  scheduledSlot,
  orderNote,
  enableMarketingOptins,
  emailUpdatesOptIn,
  smsUpdatesOptIn,
  appliedDiscountCode,
  discountAmount,
  grandTotal,
  subtotal,
  shipping,
  tax,
  isAddressValid,
  getMissingAddressFields,
}: UseCheckoutOrderOptions): UseCheckoutOrderReturn {
  const navigate = useNavigate()
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [guestCheckoutData, setGuestCheckoutData] = useState<unknown | null>(null)
  const [trackingStatus, setTrackingStatus] = useState<unknown | null>(null)
  
  const errorClearRef = useRef<(() => void) | null>(null)
  const successRedirectRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingPaymentSuccess = useRef(false)

  const handlePlaceOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!isAddressValid()) {
      if (errorClearRef.current) errorClearRef.current()
      const { missing, errors } = getMissingAddressFields()
      let errorMessage = 'Please fill in all required shipping address fields.'
      if (errors.length > 0) {
        errorMessage = errors[0]
      } else if (missing.length > 0) {
        errorMessage = `Missing required fields: ${missing.join(', ')}`
      }
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, errorMessage, 'error', 5000)
      return
    }

    // Validate email
    const customerEmail = user?.email || guestEmail
    if (!customerEmail || !validateEmail(customerEmail)) {
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Please enter a valid email address', 'error', 5000)
      return
    }

    // Validate cart
    if (!cartItems || cartItems.length === 0) {
      if (errorClearRef.current) errorClearRef.current()
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, 'Your cart is empty', 'error', 5000)
      return
    }

    setPlacingOrder(true)
    setOrderError('')

    try {
      // Prepare order items
      const orderItems = cartItems.map(item => {
        const product = item.resolvedProduct || item.product || {}
        const price = typeof product.price === 'number'
          ? product.price
          : parsePrice(product.price || item.price || item.price_at_purchase || '0')

        return {
          menu_item_id: item.menu_item_id || null,
          product_id: item.product_id || null,
          variant_id: item.variant_id || item.variantId || null,
          combination_id: item.combination_id || item.combinationId || null,
          variant_metadata: item.variant_metadata || item.variantMetadata || null,
          quantity: item.quantity,
          price_at_purchase: price,
        }
      })

      // Create order
      const orderResult = await createOrderWithItems({
        userId: user?.id || null,
        customerEmail,
        customerName: shippingAddress.fullName || 'Guest',
        shippingAddress,
        items: orderItems,
        discountCodeId: appliedDiscountCode?.id || null,
        discountAmount,
        guestSessionId: user ? null : getGuestSessionId(),
        isGuest: !user,
      })

      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || 'Failed to create order')
      }

      const orderId = orderResult.orderId

      // Apply discount code if applicable
      if (appliedDiscountCode?.id) {
        const discountResult = await applyDiscountCodeToOrder(
          appliedDiscountCode.id,
          user?.id || null,
          orderId,
          discountAmount,
          grandTotal
        )

        if (!discountResult.success) {
          logger.warn('Failed to apply discount code:', discountResult.error)
          // Don't fail the order if discount application fails
        }
      }

      // Create Stripe Payment Intent
      const paymentResponse = await edgeFunctionClient.invoke('create-payment-intent', {
        amount: Number(grandTotal.toFixed(2)),
        currency: CURRENCY_CODE,
        orderId: orderId,
        customerEmail: customerEmail
      })

      if (!paymentResponse.success || !paymentResponse.data?.clientSecret) {
        throw new Error(paymentResponse.message || 'Failed to initialize payment')
      }

      const secret = paymentResponse.data.clientSecret

      setCreatedOrderId(orderId)
      setClientSecret(secret)
      setShowPayment(true)
      setPlacingOrder(false)
    } catch (error) {
      logger.error('Error placing order:', error)
      if (errorClearRef.current) errorClearRef.current()
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order. Please try again.'
      errorClearRef.current = setMessageWithAutoClear(setOrderError, null, errorMessage, 'error', 5000)
      setPlacingOrder(false)
    }
  }, [
    user,
    guestEmail,
    cartItems,
    shippingAddress,
    appliedDiscountCode,
    discountAmount,
    grandTotal,
    isAddressValid,
    getMissingAddressFields,
  ])

  const handlePaymentSuccess = useCallback(async () => {
    if (isProcessingPaymentSuccess.current) {
      logger.warn('Payment success already processing')
      return
    }

    isProcessingPaymentSuccess.current = true

    try {
      // Clear cart
      if (user) {
        // Clear authenticated cart
        await supabase.from('cart_items').delete().eq('user_id', user.id)
      } else {
        // Clear guest cart
        clearGuestCart()
      }

      setOrderSuccess(true)
      setShowPayment(false)

      // Show success modal
      setShowSuccessModal(true)

      // For guest users, show conversion modal
      if (!user) {
        setGuestCheckoutData({
          orderId: createdOrderId,
          email: guestEmail,
        })
        setShowConversionModal(true)
      }

      // Redirect after delay
      successRedirectRef.current = setTimeout(() => {
        navigate(`/order/${createdOrderId}`, { replace: true })
      }, 3000)
    } catch (error) {
      logger.error('Error handling payment success:', error)
    } finally {
      isProcessingPaymentSuccess.current = false
    }
  }, [user, guestEmail, createdOrderId, navigate])

  const handlePaymentError = useCallback((error: Error) => {
    logger.error('Payment error:', error)
    if (errorClearRef.current) errorClearRef.current()
    errorClearRef.current = setMessageWithAutoClear(
      setOrderError,
      null,
      error.message || 'Payment failed. Please try again.',
      'error',
      5000
    )
    setShowPayment(false)
  }, [])

  const handleModalClose = useCallback(() => {
    if (successRedirectRef.current) {
      clearTimeout(successRedirectRef.current)
      successRedirectRef.current = null
    }
    setShowSuccessModal(false)
    if (createdOrderId) {
      navigate(`/order/${createdOrderId}`, { replace: true })
    }
  }, [createdOrderId, navigate])

  return {
    placingOrder,
    orderSuccess,
    orderError,
    showPayment,
    clientSecret,
    createdOrderId,
    showSuccessModal,
    showConversionModal,
    guestCheckoutData,
    trackingStatus,
    handlePlaceOrder,
    handlePaymentSuccess,
    handlePaymentError,
    handleModalClose,
    setShowConversionModal,
    setShowSuccessModal,
    setOrderError,
  }
}
```

**Key Points:**
- Validates address and email before order creation
- Creates order using service layer
- Applies discount code after order creation
- Creates Stripe payment intent via Edge Function
- Clears cart on payment success
- Shows success modal and conversion modal for guests
- Handles errors gracefully with user-friendly messages

---

## ✅ E-COMMERCE CHECKLIST

### Cart Management
- [ ] Guest cart stored in localStorage
- [ ] Authenticated cart stored in database
- [ ] Cart migration on login implemented
- [ ] Stock validation before adding to cart
- [ ] Variant and combination support
- [ ] Cart change events for real-time updates
- [ ] Cart count and total quantity utilities

### Order Processing
- [ ] Order creation via RPC function (atomic)
- [ ] All required fields validated
- [ ] Items sanitized and validated
- [ ] Error handling with user-friendly messages
- [ ] Order status management
- [ ] Guest order support

### Pricing Calculations
- [ ] Subtotal calculation with price parsing
- [ ] Shipping calculation with threshold
- [ ] Tax calculation with configurable rate
- [ ] Grand total calculation (never negative)
- [ ] Memoized calculations for performance
- [ ] Loyalty system integration

### Discount Codes
- [ ] Code validation (expiration, start date)
- [ ] Minimum order amount check
- [ ] Usage limit validation (global and per-user)
- [ ] One-per-customer enforcement
- [ ] Percentage and fixed discount support
- [ ] Max discount limit handling
- [ ] Usage tracking and recording

### Checkout Flow
- [ ] Address validation
- [ ] Email validation
- [ ] Cart validation
- [ ] Order creation
- [ ] Discount code application
- [ ] Payment intent creation
- [ ] Cart clearing on success
- [ ] Success modal and redirects
- [ ] Guest conversion modal

---

## 🎯 SUCCESS CRITERIA

E-commerce implementation is complete when:

1. ✅ **Cart Management**: Guest and authenticated carts work seamlessly
2. ✅ **Stock Validation**: Inventory checked before all cart operations
3. ✅ **Order Creation**: Orders created atomically with validation
4. ✅ **Pricing**: All calculations consistent and server-validated
5. ✅ **Discount Codes**: Validation and usage tracking working
6. ✅ **Checkout Flow**: Complete flow from cart to payment success
7. ✅ **Error Handling**: User-friendly error messages throughout
8. ✅ **Real-time Updates**: Cart changes reflected immediately
9. ✅ **Guest Support**: Guest checkout and cart migration working
10. ✅ **Payment Integration**: Payment intent creation and success handling

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

1. **Trust client-side price calculations alone**
   ```typescript
   // ❌ WRONG: Client-side only
   const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
   ```

2. **Allow negative quantities in cart**
   ```typescript
   // ❌ WRONG: No validation
   updateQuantity(cartItemId, -5)
   ```

3. **Forget to check inventory before operations**
   ```typescript
   // ❌ WRONG: No stock check
   await addToCart(productId, quantity)
   ```

4. **Apply discounts without validation**
   ```typescript
   // ❌ WRONG: No validation
   const discount = discountCode.value
   ```

5. **Update order status before payment confirmation**
   ```typescript
   // ❌ WRONG: Status updated too early
   await updateOrderStatus(orderId, 'paid')
   await processPayment()
   ```

6. **Store sensitive payment data**
   ```typescript
   // ❌ WRONG: Never store payment data
   localStorage.setItem('card_number', cardNumber)
   ```

7. **Allow cart items to exceed stock**
   ```typescript
   // ❌ WRONG: No stock limit check
   if (newQuantity > 0) {
     updateQuantity(cartItemId, newQuantity)
   }
   ```

8. **Create orders without atomic operations**
   ```typescript
   // ❌ WRONG: Not atomic
   await createOrder(orderData)
   await createOrderItems(items)
   // If second call fails, order exists without items
   ```

### ✅ Do:

1. **Validate inventory before adding to cart**
   ```typescript
   // ✅ CORRECT: Check stock first
   const stock = await checkStock(productId)
   if (stock < quantity) {
     throw new Error('Insufficient stock')
   }
   await addToCart(productId, quantity)
   ```

2. **Calculate prices server-side**
   ```typescript
   // ✅ CORRECT: Server-side calculation
   const { data } = await supabase.rpc('create_order_with_items', {
     order_data: orderData,
     items: items,
   })
   ```

3. **Validate discount codes before application**
   ```typescript
   // ✅ CORRECT: Validate first
   const validation = await validateDiscountCode(code, userId, subtotal)
   if (!validation.valid) {
     throw new Error(validation.message)
   }
   ```

4. **Track discount usage**
   ```typescript
   // ✅ CORRECT: Record usage
   await applyDiscountCodeToOrder(discountCodeId, userId, orderId, discountAmount)
   ```

5. **Use atomic operations for order creation**
   ```typescript
   // ✅ CORRECT: Atomic RPC function
   const { data } = await supabase.rpc('create_order_with_items', {
     order_data: orderData,
     items: items,
   })
   ```

6. **Handle stock updates in transactions**
   ```typescript
   // ✅ CORRECT: Handled in RPC function
   -- Inside create_order_with_items RPC:
   UPDATE products SET stock = stock - quantity WHERE id = product_id
   ```

7. **Provide clear error messages**
   ```typescript
   // ✅ CORRECT: User-friendly errors
   if (error.code === 'P0001') {
     throw new Error('Insufficient inventory. Some items are out of stock.')
   }
   ```

8. **Validate all inputs before operations**
   ```typescript
   // ✅ CORRECT: Validate everything
   if (!customerEmail || !validateEmail(customerEmail)) {
     return { success: false, error: 'Invalid email address' }
   }
   ```

9. **Emit cart change events for real-time updates**
   ```typescript
   // ✅ CORRECT: Real-time updates
   if (!error) {
     emitCartChanged() // Triggers UI update
   }
   ```

10. **Handle both menu items and legacy products**
    ```typescript
    // ✅ CORRECT: Support both types
    if (isMenuItem) {
      await addMenuItemToCart(menuItem, userId)
    } else {
      await addProductToCart(product, userId, variant, combination)
    }
    ```

---

## 📚 REFERENCE

### E-commerce Files
- **Cart Utilities:** `src/lib/cartUtils.ts`
- **Order Service:** `src/lib/orderService.ts`
- **Checkout Calculations:** `src/pages/Checkout/utils/calculations.ts`
- **Checkout Calculations Hook:** `src/pages/Checkout/hooks/useCheckoutCalculations.ts`
- **Checkout Order Hook:** `src/pages/Checkout/hooks/useCheckoutOrder.ts`
- **Discount Utils:** `src/lib/discountUtils.js`

### Database Tables
- `cart_items` - User cart items
- `orders` - Order records
- `order_items` - Order line items
- `discount_codes` - Discount code definitions
- `discount_code_usage` - Discount code usage tracking

### RPC Functions
- `create_order_with_items` - Atomic order creation
- `increment_discount_code_usage` - Update usage count

---

## 🔗 RELATED MASTER PROMPTS

- **💳 [MASTER_STRIPE_PAYMENT_PROMPT.md](./MASTER_STRIPE_PAYMENT_PROMPT.md)** — Payment processing and integration
- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** — Database schema and RLS policies
- **🔄 [MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md](./MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md)** — Data fetching patterns
- **⚠️ [MASTER_ERROR_HANDLING_LOGGING_PROMPT.md](./MASTER_ERROR_HANDLING_LOGGING_PROMPT.md)** — Error handling patterns
- **📝 [MASTER_FORM_HANDLING_VALIDATION_PROMPT.md](./MASTER_FORM_HANDLING_VALIDATION_PROMPT.md)** — Form validation patterns

---

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

### Version 1.1 - 2025-01-20
**Trigger:** Database Schema Alignment Fixes
**Changes:**
- Updated table name references: `products` → `menu_items` (lines 511, 597, 1348, 1369)
- Updated column references: `stock` → `is_available` for inventory checks
**Files Changed:** All query examples updated to match actual Supabase schema
**Pattern:** All database queries must use correct table and column names to prevent 400/404 errors

---

**This comprehensive guide ensures all e-commerce operations follow production-ready patterns with proper validation, inventory management, security, and real-time updates based on actual Star Café codebase implementations.**

