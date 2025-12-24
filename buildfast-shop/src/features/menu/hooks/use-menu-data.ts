/**
 * useMenuData Hook
 *
 * Custom hook for fetching and managing menu data.
 * Uses React Query for data fetching, caching, and synchronization.
 *
 * @returns {Object} Menu data, loading state, and error
 *
 * @example
 * const { menuItems, categories, loading, error, refetch } = useMenuData();
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import { logError } from '../../../lib/error-handler'
import { defaultQueryConfig } from '../../../shared/lib/query-config'
import type { Database } from '../../../lib/database.types'

type MenuCategory = Database['public']['Tables']['menu_categories']['Row']
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  menu_categories?: {
    id: string
    name: string
    slug?: string
  } | null
}

interface MenuData {
  categories: MenuCategory[]
  items: MenuItem[]
}

interface UseMenuDataOptions {
  enabled?: boolean
}

interface UseMenuDataReturn {
  menuItems: MenuItem[]
  categories: MenuCategory[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Fetch menu data (categories and items)
 *
 * Uses get_public_menu() RPC function for optimized single-query fetching.
 * Falls back to separate queries if RPC is unavailable.
 *
 * @returns {Promise<MenuData>} Menu data with categories and items
 */
async function fetchMenuData(): Promise<MenuData> {
  try {
    // Try RPC function first (faster - 1 query instead of 2)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_menu')

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
      // Transform RPC response to match expected format
      const rpcArray = rpcData as Array<Record<string, unknown>>
      if (rpcArray.length === 0) {
        return { categories: [], items: [] }
      }
      const categories: MenuCategory[] =
        rpcArray.length > 0
          ? rpcArray
              .filter(
                (cat: unknown): cat is Record<string, unknown> =>
                  cat !== null && typeof cat === 'object' && !Array.isArray(cat)
              )
              .map((cat: Record<string, unknown>): MenuCategory => {
                const categoryName = typeof cat.category_name === 'string' ? cat.category_name : ''
                return {
                  id: String(cat.category_id || ''),
                  name: String(categoryName || ''),
                  slug: String(categoryName.toLowerCase().replace(/\s+/g, '-') || ''),
                  description: typeof cat.description === 'string' ? cat.description : null,
                  image_url: typeof cat.image_url === 'string' ? cat.image_url : null,
                  sort_order: Number(cat.category_order || 0),
                  is_active: cat.is_active !== false,
                  created_at: String(cat.created_at || new Date().toISOString()),
                  updated_at: String(cat.updated_at || new Date().toISOString()),
                }
              })
          : []

      // Flatten dishes from all categories
      const items: MenuItem[] = rpcArray.flatMap((cat: unknown) => {
        if (!cat || typeof cat !== 'object' || Array.isArray(cat)) return []
        const catRecord = cat as Record<string, unknown>
        const dishesArray = Array.isArray(catRecord.dishes) ? catRecord.dishes : []
        if (dishesArray.length === 0) return []
        const dishes = dishesArray.map((dish: unknown) => ({
          ...(dish as Record<string, unknown>),
          category_id: catRecord.category_id,
          menu_categories: {
            id: String(catRecord.category_id || ''),
            name: String(catRecord.category_name || ''),
            slug: String(
              (typeof catRecord.category_name === 'string' ? catRecord.category_name : '')
                .toLowerCase()
                .replace(/\s+/g, '-')
            ),
          },
        })) as MenuItem[]
        return dishes
      })

      return {
        categories: categories || [],
        items: items || [],
      }
    }

    // Fallback to separate queries if RPC fails or returns empty
    logger.warn(
      'RPC get_public_menu failed or returned empty, falling back to separate queries:',
      rpcError
    )

    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order')

    if (categoriesError) {
      logError(categoriesError, 'fetchMenuData.categories')
      throw categoriesError
    }

    // Fetch available menu items with category info
    const { data: itemsData, error: itemsError } = await supabase
      .from('menu_items')
      .select(
        `
        *,
        menu_categories (
          id,
          name,
          slug
        )
      `
      )
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (itemsError) {
      logError(itemsError, 'fetchMenuData.items')
      throw itemsError
    }

    return {
      categories: (categoriesData as MenuCategory[]) || [],
      items: (itemsData as MenuItem[]) || [],
    }
  } catch (error) {
    logError(error, 'fetchMenuData')
    throw error
  }
}

/**
 * useMenuData Hook
 *
 * Fetches and manages menu data with React Query.
 *
 * @param {UseMenuDataOptions} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {UseMenuDataReturn} Menu data, loading state, and error
 */
export function useMenuData(options: UseMenuDataOptions = {}): UseMenuDataReturn {
  const { enabled = true } = options

  const {
    data: menuData,
    isLoading,
    error,
    refetch,
  }: UseQueryResult<MenuData, Error> = useQuery({
    queryKey: queryKeys.menu.public(),
    queryFn: fetchMenuData,
    enabled,
    ...defaultQueryConfig,
  })

  return {
    menuItems: menuData?.items || [],
    categories: menuData?.categories || [],
    loading: isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch()
    },
  }
}
