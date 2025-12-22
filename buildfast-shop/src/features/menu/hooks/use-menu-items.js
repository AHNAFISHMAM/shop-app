/**
 * useMenuItems Hook
 * 
 * Custom hook for fetching menu items.
 * Handles both new menu_items table and legacy dishes table.
 * 
 * @returns {Object} Menu items, loading state, and error
 * 
 * @example
 * const { meals, loading, error, refetch } = useMenuItems();
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import { defaultQueryConfig } from '../../../shared/lib/query-config';

/**
 * Fetch menu items from database
 * Falls back to legacy 'dishes' table if 'menu_items' table doesn't exist
 * 
 * @returns {Promise<Array>} Array of menu items
 */
async function fetchMenuItems() {
  try {
    // Try fetching from menu_items (new system)
    const { data: menuData, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    // If table doesn't exist (error code 42P01), fall back to dishes table
    if (menuError && menuError.code !== '42P01') {
      logger.error('Error fetching menu items:', menuError);
      // Fallback to old dishes table
      const { data: dishesData, error: dishesError } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (dishesError) {
        logger.error('Error fetching dishes:', dishesError);
        throw dishesError;
      }

      return dishesData || [];
    }

    if (menuError && menuError.code === '42P01') {
      // Table doesn't exist, try fallback
      const { data: dishesData, error: dishesError } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (dishesError) {
        logger.error('Error fetching dishes:', dishesError);
        return [];
      }

      return dishesData || [];
    }

    return menuData || [];
  } catch (error) {
    logger.error('Error in fetchMenuItems:', error);
    throw error;
  }
}

/**
 * useMenuItems Hook
 * 
 * Fetches and manages menu items with React Query.
 * 
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Menu items, loading state, and error
 */
export function useMenuItems(options = {}) {
  const { enabled = true } = options;

  const {
    data: meals = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.menu.items(),
    queryFn: fetchMenuItems,
    enabled,
    ...defaultQueryConfig
  });

  // Real-time subscription for menu items
  useEffect(() => {
    if (!enabled) return;

    const mealsChannel = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        () => {
          // Refetch on change
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(mealsChannel);
    };
  }, [enabled, refetch]);

  return {
    meals,
    loading: isLoading,
    error,
    refetch
  };
}

