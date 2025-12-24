/**
 * useProduct Hook
 *
 * Custom hook for fetching a single product by ID.
 * Handles both menu_items and dishes tables.
 *
 * @returns {Object} Product, loading state, and error
 *
 * @example
 * const { product, loading, error, refetch } = useProduct(productId);
 */

import { useEffect } from 'react'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { supabase } from '../../../lib/supabase'
import { logError } from '../../../lib/error-handler'
import { defaultQueryConfig } from '../../../shared/lib/query-config'
import { addToRecentlyViewed } from '../../../lib/recentlyViewedUtils'
import type { Database } from '../../../lib/database.types'

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  menu_categories?: {
    id: string
    name: string
  } | null
}

// Note: dishes table may not exist in all database schemas
type Dish = {
  id: string
  name: string
  description: string | null
  price: number | string
  image_url: string | null
  stock_quantity?: number | null
  [key: string]: unknown
}

interface NormalizedProduct {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  isMenuItem: boolean
  category?: string | null
  images?: string[]
  stock_quantity?: number | null
  currency?: string
  [key: string]: unknown
}

interface ProductData {
  product: NormalizedProduct | null
  source: 'menu_items' | 'dishes'
  isMenuItem: boolean
}

interface UseProductOptions {
  enabled?: boolean
}

interface UseProductReturn {
  product: NormalizedProduct | null
  source: 'menu_items' | 'dishes' | null
  isMenuItem: boolean
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Normalize menu item to product format
 *
 * @param {MenuItem} menuItem - Menu item from database
 * @returns {NormalizedProduct | null} Normalized product
 */
function normalizeMenuItem(menuItem: MenuItem | null): NormalizedProduct | null {
  if (!menuItem) return null

  const priceValue =
    typeof menuItem.price === 'number'
      ? menuItem.price
      : parseFloat(String(menuItem.price || '0')) || 0

  const menuItemRecord = menuItem as Record<string, unknown>
  return {
    id: menuItem.id,
    name: menuItem.name || '',
    description: menuItem.description || null,
    price: priceValue,
    image_url: menuItem.image_url || null,
    isMenuItem: true,
    category: menuItem.menu_categories?.name || null,
    images: menuItem.image_url ? [menuItem.image_url] : [],
    stock_quantity: menuItem.is_available === false ? 0 : null,
    currency: '৳',
    ...menuItemRecord,
  } as NormalizedProduct
}

/**
 * Fetch product by ID
 * Tries menu_items first, then falls back to dishes table
 *
 * @param {string} productId - Product ID
 * @returns {Promise<ProductData>} Product data with source info
 */
async function fetchProduct(productId: string): Promise<ProductData> {
  if (!productId) {
    throw new Error('Product ID is required')
  }

  try {
    // Try fetching from menu_items first
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select(
        `
        *,
        menu_categories (
          id,
          name
        )
      `
      )
      .eq('id', productId)
      .maybeSingle()

    if (menuError && menuError.code !== 'PGRST116') {
      logError(menuError, 'fetchProduct.menuItem')
      throw menuError
    }

    if (menuItem) {
      const normalized = normalizeMenuItem(menuItem as MenuItem)
      if (normalized) {
        addToRecentlyViewed(normalized.id, 'menu_item')
        return {
          product: normalized,
          source: 'menu_items',
          isMenuItem: true,
        }
      }
    }

    // Fall back to dishes table
    const { data: dish, error: dishError } = await supabase
      .from('dishes')
      .select('*')
      .eq('id', productId)
      .maybeSingle()

    if (dishError && dishError.code !== 'PGRST116') {
      logError(dishError, 'fetchProduct.dish')
      throw dishError
    }

    if (!dish) {
      throw new Error('Product not found')
    }

    addToRecentlyViewed(productId, 'product')

    // Normalize dish to product format
    const dishRecord = dish as Dish & Record<string, unknown>
    const normalizedDish: NormalizedProduct = {
      ...dishRecord,
      id: dishRecord.id,
      name: dishRecord.name || '',
      description: dishRecord.description || null,
      price:
        typeof dishRecord.price === 'number'
          ? dishRecord.price
          : parseFloat(String(dishRecord.price || '0')) || 0,
      image_url: dishRecord.image_url || null,
      isMenuItem: false,
      category: null,
      images: dishRecord.image_url ? [dishRecord.image_url] : [],
      stock_quantity: dishRecord.stock_quantity || null,
      currency: '৳',
    }

    return {
      product: normalizedDish,
      source: 'dishes',
      isMenuItem: false,
    }
  } catch (error) {
    logError(error, 'fetchProduct')
    throw error
  }
}

/**
 * useProduct Hook
 *
 * Fetches and manages product data with React Query.
 *
 * @param {string} productId - Product ID
 * @param {UseProductOptions} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {UseProductReturn} Product, loading state, and error
 */
export function useProduct(
  productId: string | undefined,
  options: UseProductOptions = {}
): UseProductReturn {
  const { enabled = true } = options

  const {
    data: productData,
    isLoading,
    error,
    refetch,
  }: UseQueryResult<ProductData, Error> = useQuery({
    queryKey: queryKeys.menu.item(productId || ''),
    queryFn: () => fetchProduct(productId!),
    enabled: enabled && !!productId,
    ...defaultQueryConfig,
  })

  // Real-time subscription for product updates
  useEffect(() => {
    if (!productId || !productData || !enabled) return

    const source = productData.source
    const channelName =
      source === 'menu_items' ? `menu-item-${productId}-changes` : `product-${productId}-changes`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: source,
          filter: `id=eq.${productId}`,
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId, productData, enabled, refetch])

  return {
    product: productData?.product || null,
    source: productData?.source || null,
    isMenuItem: productData?.isMenuItem || false,
    loading: isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch()
    },
  }
}
