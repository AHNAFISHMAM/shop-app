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

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';
import { defaultQueryConfig } from '../../../shared/lib/query-config';
import { addToRecentlyViewed } from '../../../lib/recentlyViewedUtils';

/**
 * Normalize menu item to product format
 * 
 * @param {Object} menuItem - Menu item from database
 * @returns {Object} Normalized product
 */
function normalizeMenuItem(menuItem) {
  if (!menuItem) return null;
  
  const priceValue = typeof menuItem.price === 'number'
    ? menuItem.price
    : parseFloat(menuItem.price || '0') || 0;

  return {
    ...menuItem,
    isMenuItem: true,
    category: menuItem.menu_categories?.name || menuItem.category || null,
    images: menuItem.image_url ? [menuItem.image_url] : [],
    stock_quantity: menuItem.is_available === false ? 0 : null,
    price: priceValue,
    currency: menuItem.currency || '৳'
  };
}

/**
 * Fetch product by ID
 * Tries menu_items first, then falls back to dishes table
 * 
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product data with source info
 */
async function fetchProduct(productId) {
  if (!productId) {
    throw new Error('Product ID is required');
  }

  try {
    // Try fetching from menu_items first
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select(`
        *,
        menu_categories (
          id,
          name
        )
      `)
      .eq('id', productId)
      .maybeSingle();

    if (menuError && menuError.code !== 'PGRST116') {
      logger.error('Error fetching menu item:', menuError);
      throw menuError;
    }

    if (menuItem) {
      const normalized = normalizeMenuItem(menuItem);
      addToRecentlyViewed(normalized.id, 'menu_item');
      return {
        product: normalized,
        source: 'menu_items',
        isMenuItem: true
      };
    }

    // Fall back to dishes table
    const { data: dish, error: dishError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (dishError && dishError.code !== 'PGRST116') {
      logger.error('Error fetching dish:', dishError);
      throw dishError;
    }

    if (!dish) {
      throw new Error('Product not found');
    }

    addToRecentlyViewed(productId, 'product');
    return {
      product: { ...dish, isMenuItem: false },
      source: 'dishes',
      isMenuItem: false
    };
  } catch (error) {
    logger.error('Error in fetchProduct:', error);
    throw error;
  }
}

/**
 * useProduct Hook
 * 
 * Fetches and manages product data with React Query.
 * 
 * @param {string} productId - Product ID
 * @param {Object} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Product, loading state, and error
 */
export function useProduct(productId, options = {}) {
  const { enabled = true } = options;

  const {
    data: productData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.menu.item(productId),
    queryFn: () => fetchProduct(productId),
    enabled: enabled && !!productId,
    ...defaultQueryConfig
  });

  // Real-time subscription for product updates
  useEffect(() => {
    if (!productId || !productData || !enabled) return;

    const source = productData.source;
    const channelName = source === 'menu_items' 
      ? `menu-item-${productId}-changes`
      : `product-${productId}-changes`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: source,
          filter: `id=eq.${productId}`
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, productData, enabled, refetch]);

  return {
    product: productData?.product || null,
    source: productData?.source || null,
    isMenuItem: productData?.isMenuItem || false,
    loading: isLoading,
    error,
    refetch
  };
}

