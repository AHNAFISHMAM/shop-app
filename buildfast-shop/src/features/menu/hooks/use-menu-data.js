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

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import { defaultQueryConfig } from '../../../shared/lib/query-config';

/**
 * Fetch menu data (categories and items)
 * 
 * @returns {Promise<Object>} Menu data with categories and items
 */
async function fetchMenuData() {
  try {
    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order');

    if (categoriesError) {
      logger.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    // Fetch available menu items with category info
    const { data: itemsData, error: itemsError } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name,
          slug
        )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (itemsError) {
      logger.error('Error fetching menu items:', itemsError);
      throw itemsError;
    }

    return {
      categories: categoriesData || [],
      items: itemsData || []
    };
  } catch (error) {
    logger.error('Error in fetchMenuData:', error);
    throw error;
  }
}

/**
 * useMenuData Hook
 * 
 * Fetches and manages menu data with React Query.
 * 
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Menu data, loading state, and error
 */
export function useMenuData(options = {}) {
  const { enabled = true } = options;

  const {
    data: menuData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.menu.public(),
    queryFn: fetchMenuData,
    enabled,
    ...defaultQueryConfig
  });

  return {
    menuItems: menuData?.items || [],
    categories: menuData?.categories || [],
    loading: isLoading,
    error,
    refetch
  };
}

