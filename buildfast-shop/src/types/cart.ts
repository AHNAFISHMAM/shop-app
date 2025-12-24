/**
 * Shared Cart Types
 *
 * Centralized type definitions for cart-related components
 */

/**
 * Product interface (for menu_items or dishes)
 */
export interface Product {
  id: string
  name: string
  price: number | string
  currency?: string
  description?: string
  image_url?: string | null
  images?: string[] | null
  is_available?: boolean
  stock_quantity?: number | null
  category_id?: string | null
  isMenuItem?: boolean
  [key: string]: unknown
}

/**
 * Cart item interface
 * Compatible across all cart components
 */
export interface CartItem {
  id: string
  product_id?: string | null
  menu_item_id?: string | null
  quantity: number
  menu_items?: Product | null
  dishes?: Product | null
  [key: string]: unknown
}

/**
 * Function to get image URL for a cart item or product
 */
export type GetImageUrlFunction = (item: CartItem | Product | { [key: string]: unknown }) => string
