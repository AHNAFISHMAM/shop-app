import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import {
  addToGuestCart,
  updateGuestCartQuantity,
  removeFromGuestCart,
} from '../lib/guestSessionUtils';
import { emitCartChanged } from '../lib/cartEvents';
import { parsePrice } from '../lib/priceUtils';
import { resolveLoyaltyState } from '../lib/loyaltyUtils';
import { logger } from '../utils/logger';

/**
 * Custom hook for cart management
 * Handles both authenticated and guest users
 *
 * FIXED BUGS:
 * - ✅ CRITICAL #7: Guest cart ID mismatch (now uses actual UUIDs from localStorage)
 * - ✅ Correctly passes item.id to updateGuestCartQuantity and removeFromGuestCart
 */
export const useCartManagement = (user) => {
  const [cartItems, setCartItems] = useState([]);

  // Fetch cart items (authenticated or guest)
  const fetchCartItems = useCallback(async () => {
    try {
      if (user) {
        // Fetch cart with both menu_items and dishes (backward compatible)
        const { data } = await supabase
          .from('cart_items')
          .select(`
            *,
            menu_items (*),
            dishes (*)
          `)
          .eq('user_id', user.id);

        const normalized = (data || []).map((item) => ({
          ...item,
          resolvedProduct: item.menu_items || item.dishes || null,
          resolvedProductType: item.menu_items ? 'menu_item' : item.dishes ? 'dish' : null,
        }));

        setCartItems(normalized);
      } else {
        // Get guest cart from localStorage
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');

        // Fetch product details for guest cart
        if (guestCart.length > 0) {
          const menuItemIds = guestCart.filter(item => item.menu_item_id).map((item) => item.menu_item_id);
          const dishIds = guestCart.filter(item => item.product_id).map((item) => item.product_id);

          let menuItemsData = [];
          let dishesData = [];

          // Fetch menu items if any
          if (menuItemIds.length > 0) {
            const { data } = await supabase
              .from('menu_items')
              .select('*')
              .eq('is_available', true)
              .in('id', menuItemIds);
            menuItemsData = data || [];
          }

          // Fetch dishes if any (backward compatible)
          if (dishIds.length > 0) {
            const { data } = await supabase
              .from('dishes')
              .select('*')
              .eq('is_active', true)
              .in('id', dishIds);
            dishesData = data || [];
          }

          // FIXED: Use actual UUID from guestSessionUtils
          const cartWithProducts = guestCart.map((item) => {
            const menuItem = menuItemsData?.find((p) => p.id === item.menu_item_id) || null;
            const dish = dishesData?.find((p) => p.id === item.product_id) || null;

            return {
            id: item.id, // Fixed: Use actual UUID from localStorage
            product_id: item.product_id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            menu_items: menuItem,
            dishes: dish,
            resolvedProduct: menuItem || dish || item.product || null,
            resolvedProductType: menuItem ? 'menu_item' : dish ? 'dish' : (item.product ? 'legacy' : null),
          };
          }).filter((item) => item.resolvedProduct);

          setCartItems(cartWithProducts);
        } else {
          setCartItems([]);
        }
      }
    } catch (error) {
      logger.error('Error fetching cart:', error);
    }
  }, [user]);

  // Fetch cart on mount and when user changes
  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // Calculate cart summary
  const cartSummary = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const product = item.resolvedProduct;
      const price = parsePrice(product?.price) || 0;
      return sum + price * item.quantity;
    }, 0);
    
    // Round to 2 decimal places to prevent floating point errors
    const roundedSubtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = roundedSubtotal > 500 ? 0 : 50; // Free delivery over 500 BDT
    const total = Math.round((roundedSubtotal + deliveryFee) * 100) / 100;

    const loyalty = resolveLoyaltyState(total);

    return { 
      subtotal: roundedSubtotal, 
      deliveryFee, 
      total, 
      loyalty 
    };
  }, [cartItems]);

  // Add product to cart (supports both menu_items and dishes)
  const handleAddToCart = useCallback(
    async (product, isMenuItem = false) => {
      try {
        // Check stock/availability
        if (isMenuItem && product.is_available === false) {
          toast.error('This item is currently unavailable');
          return;
        }
        if (!isMenuItem && product.stock_quantity === 0) {
          toast.error('This item is out of stock');
          return;
        }

        if (user) {
          // Check if already in cart
          const existingItem = cartItems.find((item) =>
            isMenuItem
              ? item.menu_item_id === product.id
              : item.product_id === product.id
          );

          if (existingItem) {
            // Update quantity
            const { error } = await supabase
              .from('cart_items')
              .update({ quantity: existingItem.quantity + 1 })
              .eq('id', existingItem.id);

            if (error) {
              logger.error('Error updating cart quantity:', error);
              throw error;
            }
          } else {
            // Insert new
            const insertData = {
              user_id: user.id,
              quantity: 1,
            };

            if (isMenuItem) {
              insertData.menu_item_id = product.id;
            } else {
              insertData.product_id = product.id;
            }

            const { data, error } = await supabase
              .from('cart_items')
              .insert(insertData)
              .select();

            if (error) {
              logger.error('Error inserting cart item:', error);
              logger.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
              });
              throw error;
            }

            logger.log('Cart item inserted:', data);
          }
        } else {
          // Guest cart
          const guestCart = JSON.parse(
            localStorage.getItem('guest_cart') || '[]'
          );
          const existingItem = guestCart.find((item) =>
            isMenuItem
              ? item.menu_item_id === product.id
              : item.product_id === product.id
          );

          if (existingItem) {
            // Fixed: Now using actual UUID from localStorage
            updateGuestCartQuantity(existingItem.id, existingItem.quantity + 1);
          } else {
            addToGuestCart(product, 1, { isMenuItem });
          }
        }

        emitCartChanged(); // Trigger immediate navbar update
        await fetchCartItems();
        toast.success(`${product.name} added to cart!`, { icon: '🛒' });
      } catch (error) {
        logger.error('Error adding to cart:', error);
        toast.error(`Failed to add to cart: ${error.message || 'Unknown error'}`);
      }
    },
    [user, cartItems, fetchCartItems]
  );

  // Remove item from cart
  // Defined before handleUpdateQuantity to avoid hoisting issues
  const handleRemoveFromCart = useCallback(
    async (cartItemId) => {
      try {
        if (user) {
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

          if (error) throw error;
        } else {
          // Fixed: Use UUID (item.id) instead of product_id
          removeFromGuestCart(cartItemId);
        }

        emitCartChanged(); // Trigger immediate navbar update
        await fetchCartItems();
        toast.success('Item removed from cart');
      } catch (error) {
        logger.error('Error removing from cart:', error);
        toast.error('Failed to remove item');
      }
    },
    [user, fetchCartItems] // Removed cartItems to prevent unnecessary re-creation
  );

  // Update cart item quantity
  // Must be defined after handleRemoveFromCart since it references it
  const handleUpdateQuantity = useCallback(
    async (cartItemId, newQuantity) => {
      try {
        if (newQuantity <= 0) {
          await handleRemoveFromCart(cartItemId);
          return;
        }

        if (user) {
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', cartItemId);

          if (error) throw error;
        } else {
          // Fixed: Now using actual UUID
          updateGuestCartQuantity(cartItemId, newQuantity);
        }

        emitCartChanged(); // Trigger immediate navbar update
        await fetchCartItems();
      } catch (error) {
        logger.error('Error updating quantity:', error);
        toast.error('Failed to update quantity');
      }
    },
    [user, fetchCartItems, handleRemoveFromCart]
  );

  return {
    cartItems,
    cartSummary,
    fetchCartItems,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
  };
};
