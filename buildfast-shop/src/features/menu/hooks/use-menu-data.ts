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
import { logError, getUserFriendlyError } from '../../../lib/error-handler'
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

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      // Transform RPC response to match expected format
      const categories: MenuCategory[] = rpcData.map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        sort_order: cat.category_order,
        slug: cat.category_name?.toLowerCase().replace(/\s+/g, '-'),
        created_at: cat.created_at || new Date().toISOString(),
        updated_at: cat.updated_at || new Date().toISOString(),
      }))

      // Flatten dishes from all categories
      const items: MenuItem[] = rpcData.flatMap((cat: any) => {
        const dishes = (cat.dishes || []).map((dish: any) => ({
          ...dish,
          category_id: cat.category_id,
          menu_categories: {
            id: cat.category_id,
            name: cat.category_name,
            slug: cat.category_name?.toLowerCase().replace(/\s+/g, '-'),
          },
        }))
        return dishes
      })

      return {
        categories: categories || [],
        items: items || [],
      }
    }

    // Fallback to separate queries if RPC fails or returns empty
    logger.warn('RPC get_public_menu failed or returned empty, falling back to separate queries:', rpcError)

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

