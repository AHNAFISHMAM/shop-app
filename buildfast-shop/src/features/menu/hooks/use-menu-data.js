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
 * Uses get_public_menu() RPC function for optimized single-query fetching.
 * Falls back to separate queries if RPC is unavailable.
 * 
 * @returns {Promise<Object>} Menu data with categories and items
 */
async function fetchMenuData() {
  try {
    // Try RPC function first (faster - 1 query instead of 2)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_menu');

    if (!rpcError && rpcData && rpcData.length > 0) {
      // Transform RPC response to match expected format
      const categories = rpcData.map(cat => ({
        id: cat.category_id,
        name: cat.category_name,
        sort_order: cat.category_order,
        subcategories: cat.subcategories || []
      }));

      // Flatten dishes from all categories
      const items = rpcData.flatMap(cat => {
        const dishes = (cat.dishes || []).map(dish => ({
          ...dish,
          category_id: cat.category_id,
          menu_categories: {
            id: cat.category_id,
            name: cat.category_name,
            slug: cat.category_name.toLowerCase().replace(/\s+/g, '-')
          }
        }));
        return dishes;
      });

      return {
        categories: categories || [],
        items: items || []
      };
    }

    // Fallback to separate queries if RPC fails or returns empty
    logger.warn('RPC get_public_menu failed or returned empty, falling back to separate queries:', rpcError);

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

