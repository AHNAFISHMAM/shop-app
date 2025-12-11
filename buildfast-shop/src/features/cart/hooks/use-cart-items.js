/**
 * useCartItems Hook
 * 
 * Custom hook for fetching cart items (both authenticated and guest users).
 * 
 * @returns {Object} Cart items, loading state, and error
 * 
 * @example
 * const { cartItems, loading, error, refetch } = useCartItems();
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { supabase } from '../../../lib/supabase';
import { getGuestCart } from '../../../lib/guestSessionUtils';
import { logger } from '../../../utils/logger';
import { defaultQueryConfig } from '../../../shared/lib/query-config';

/**
 * Fetch cart items for authenticated user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Cart items with product data
 */
async function fetchUserCartItems(userId) {
  try {
    // Try to fetch from cart_items table (might not exist)
    // IMPORTANT: cart_items.product_id references dishes(id), not products(id)
    // cart_items.menu_item_id references menu_items(id)
    // Remove products(*) since there's no direct relationship with products table
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        menu_items (*),
        dishes (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Handle relationship errors (table exists but relationship doesn't)
      if (error.code === 'PGRST116' || error.message?.includes('relationship') || error.message?.includes('schema cache')) {
        logger.warn('cart_items table relationships issue - trying without joins:', error.message);
        // Fallback: fetch cart items without joins, then fetch products separately
        return await fetchUserCartItemsWithoutJoins(userId);
      }
      // Table might not exist - return empty array instead of throwing
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        logger.warn('cart_items table does not exist - returning empty cart');
        return [];
      }
      logger.error('Error fetching cart items:', error);
      throw error;
    }

    // Normalize cart items to match expected structure
    // IMPORTANT: Don't filter here - return ALL items and let components handle filtering
    // This allows components to show proper error messages for missing products
    return (data || []).map(item => ({
      ...item,
      // Map dishes to products for legacy support
      products: item.dishes || null,
      resolvedProduct: item.menu_items || item.dishes || null,
      resolvedProductType: item.menu_items ? 'menu_item' : item.dishes ? 'dish' : null
    })) // Return all items, even if products aren't resolved
  } catch (error) {
    // Handle relationship errors (table exists but relationship doesn't)
    if (error.code === 'PGRST116' || error.message?.includes('relationship') || error.message?.includes('schema cache')) {
      logger.warn('cart_items table relationships issue - trying without joins:', error.message);
      // Fallback: fetch cart items without joins, then fetch products separately
      return await fetchUserCartItemsWithoutJoins(userId);
    }
    // If table doesn't exist, return empty array (user can still use guest cart)
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      logger.warn('cart_items table does not exist - returning empty cart');
      return [];
    }
    logger.error('Error in fetchUserCartItems:', error);
    throw error;
  }
}

/**
 * Fallback function to fetch cart items without joins
 * Fetches cart items first, then fetches products separately
 */
async function fetchUserCartItemsWithoutJoins(userId) {
  try {
    // Fetch cart items without joins
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cartError) {
      if (cartError.code === '42P01' || cartError.message?.includes('does not exist')) {
        logger.warn('cart_items table does not exist - returning empty cart');
        return [];
      }
      throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
      return [];
    }

    // Extract product IDs
    const menuItemIds = [...new Set(cartItems.filter(item => item.menu_item_id).map(item => item.menu_item_id))];
    const dishIds = [...new Set(cartItems.filter(item => item.product_id).map(item => item.product_id))];

    let menuItemsMap = {};
    let dishesMap = {};

    // Fetch menu items separately
    if (menuItemIds.length > 0) {
      try {
        const { data: menuItemsData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .in('id', menuItemIds);

        if (!menuError && menuItemsData) {
          menuItemsMap = Object.fromEntries(menuItemsData.map(item => [item.id, item]));
        }
      } catch (err) {
        logger.warn('Error fetching menu items for cart (table might not exist):', err);
      }
    }

    // Fetch dishes separately
    if (dishIds.length > 0) {
      try {
        const { data: dishesData, error: dishError } = await supabase
          .from('dishes')
          .select('*')
          .in('id', dishIds);

        if (!dishError && dishesData) {
          dishesMap = Object.fromEntries(dishesData.map(item => [item.id, item]));
        }
      } catch (err) {
        logger.warn('Error fetching dishes for cart (table might not exist):', err);
      }
    }

    // Combine cart items with product data
    return cartItems.map(item => {
      const menuItem = item.menu_item_id ? menuItemsMap[item.menu_item_id] : null;
      const dish = item.product_id ? dishesMap[item.product_id] : null;

      return {
        ...item,
        menu_items: menuItem || null,
        dishes: dish || null,
        products: dish || null, // Legacy support - map dishes to products
        resolvedProduct: menuItem || dish || null,
        resolvedProductType: menuItem ? 'menu_item' : dish ? 'dish' : null
      };
    });
  } catch (error) {
    logger.error('Error in fetchUserCartItemsWithoutJoins:', error);
    return [];
  }
}

/**
 * Get guest cart items from localStorage with product data
 * 
 * @returns {Promise<Array>} Cart items with product data
 */
async function getGuestCartItems() {
  if (typeof window === 'undefined') return [];

  try {
    const guestCart = getGuestCart();
    if (!guestCart || guestCart.length === 0) return [];

    // Extract product IDs
    const menuItemIds = [...new Set(guestCart.filter(item => item.menu_item_id).map(item => item.menu_item_id))];
    const dishIds = [...new Set(guestCart.filter(item => item.product_id).map(item => item.product_id))];

    let menuItemsMap = {};
    let dishesMap = {};

    // Fetch menu items (if table exists)
    if (menuItemIds.length > 0) {
      try {
        const { data: menuItemsData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .in('id', menuItemIds);

        if (menuError) {
          // Table might not exist - log warning but don't fail
          logger.warn('Error fetching menu items for guest cart (table might not exist):', menuError);
        } else if (menuItemsData) {
          menuItemsMap = Object.fromEntries((menuItemsData || []).map(item => [item.id, item]));
        }
      } catch (err) {
        // Table doesn't exist - continue without menu items
        logger.warn('Menu items table might not exist - continuing without product data:', err);
      }
    }

    // Fetch dishes (if table exists)
    if (dishIds.length > 0) {
      try {
        const { data: dishesData, error: dishError } = await supabase
          .from('dishes')
          .select('*')
          .in('id', dishIds);

        if (dishError) {
          // Table might not exist - log warning but don't fail
          logger.warn('Error fetching dishes for guest cart (table might not exist):', dishError);
        } else if (dishesData) {
          dishesMap = Object.fromEntries((dishesData || []).map(item => [item.id, item]));
        }
      } catch (err) {
        // Table doesn't exist - continue without dishes
        logger.warn('Dishes table might not exist - continuing without product data:', err);
      }
    }

    // Also try fetching from products table (if it exists)
    const productIds = [...new Set(guestCart.filter(item => item.product_id && !item.menu_item_id).map(item => item.product_id))];
    let productsMap = {};
    if (productIds.length > 0) {
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (productsError) {
          logger.warn('Error fetching products for guest cart:', productsError);
        } else if (productsData) {
          productsMap = Object.fromEntries((productsData || []).map(item => [item.id, item]));
        }
      } catch (err) {
        logger.warn('Products table might not exist:', err);
      }
    }

    // Combine cart items with product data (match Checkout expected structure)
    // IMPORTANT: Don't filter here - return ALL items and let components handle filtering
    // This allows components to show proper error messages for missing products
    // Also use item.product if it exists (guest cart might have embedded product data)
    return guestCart.map(item => {
      const menuItem = item.menu_item_id ? menuItemsMap[item.menu_item_id] : null;
      const dish = item.product_id ? dishesMap[item.product_id] : null;
      const product = item.product_id ? (productsMap[item.product_id] || item.product) : null;

      // Use embedded product data if available (guest cart often has this)
      const resolvedProduct = menuItem || dish || product || item.product || null;
      const resolvedProductType = menuItem ? 'menu_item' : dish ? 'dish' : (product || item.product ? 'legacy' : null);

      return {
        ...item,
        menu_items: menuItem || null,
        dishes: dish || null,
        products: dish || product || item.product || null, // Legacy support
        resolvedProduct,
        resolvedProductType
      };
    }) // Return all items, even if products aren't resolved
  } catch (error) {
    logger.error('Error reading guest cart:', error);
    return [];
  }
}

/**
 * useCartItems Hook
 * 
 * Fetches and manages cart items with React Query for authenticated users,
 * or reads from localStorage for guest users.
 * 
 * @param {Object} options - Hook options
 * @param {Object|null} options.user - Current user
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Cart items, loading state, and error
 */
export function useCartItems(options = {}) {
  const { user, enabled = true } = options;

  const {
    data: cartItems = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.cart.items(user?.id || 'guest'),
    queryFn: () => user ? fetchUserCartItems(user.id) : getGuestCartItems(),
    enabled,
    ...defaultQueryConfig
  });

  // Real-time subscription for authenticated users
  useEffect(() => {
    if (!user || !enabled) return;

    const channel = supabase
      .channel('cart-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, enabled, refetch]);

  return {
    cartItems,
    loading: isLoading,
    error,
    refetch
  };
}

