/**
 * useMenuCategories Hook
 *
 * Custom hook for fetching menu categories.
 *
 * @returns {Object} Categories, loading state, and error
 *
 * @example
 * const { categories, loading, error } = useMenuCategories();
 */

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import { longLivedQueryConfig } from '../../../shared/lib/query-config'

/**
 * Fetch menu categories
 *
 * @returns {Promise<Array>} Array of menu categories
 */
async function fetchMenuCategories() {
  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching menu categories:', error)
      throw error
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchMenuCategories:', error)
    throw error
  }
}

/**
 * useMenuCategories Hook
 *
 * Fetches and manages menu categories with React Query.
 *
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Categories, loading state, and error
 */
export function useMenuCategories(options = {}) {
  const { enabled = true } = options

  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.menu.categories(),
    queryFn: fetchMenuCategories,
    enabled,
    ...longLivedQueryConfig, // Categories change infrequently
  })

  return {
    categories,
    loading: isLoading,
    error,
  }
}
