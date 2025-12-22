import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { m } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGuestCart } from '../../lib/guestSessionUtils';
import { onCartChanged } from '../../lib/cartEvents';
import { logger } from '../../utils/logger';

/**
 * Floating Cart Button Component
 *
 * Professional floating cart indicator that follows you everywhere.
 * Desktop: Fixed top-right (sticky on scroll) | Mobile: Fixed bottom-center
 * Shows total quantity of items in cart.
 *
 * Features:
 * - Real-time cart count updates
 * - Desktop and mobile variants
 * - Smooth animations
 * - Theme-aware styling
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized values and callbacks)
 * - Respects prefers-reduced-motion
 */
const FloatingCartButton = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [cartCount, setCartCount] = useState<number>(0);

  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Fetch cart count (total quantity, not unique items)
  const fetchCartCount = useCallback(async () => {
    try {
      let count = 0;

      if (user) {
        // Authenticated user - fetch from database
        const { data, error } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id);

        if (error) throw error;
        count = (data || []).reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0);
      } else {
        // Guest user - fetch from localStorage
        const guestCart = getGuestCart();
        count = guestCart.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0);
      }

      setCartCount(count);
    } catch (error) {
      logger.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  }, [user]);

  // Initial fetch and listen for cart changes
  useEffect(() => {
    fetchCartCount();

    // Listen for cart change events
    const cleanup = onCartChanged(() => {
      fetchCartCount();
    });

    // Real-time subscription for authenticated users
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (user) {
      channel = supabase
        .channel(`floating-cart-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCartCount();
          }
        )
        .subscribe();
    }

    // Listen for guest cart updates
    const handleGuestCartUpdate = () => {
      if (!user) {
        fetchCartCount();
      }
    };
    window.addEventListener('guestCartUpdated', handleGuestCartUpdate);

    return () => {
      cleanup();
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('guestCartUpdated', handleGuestCartUpdate);
    };
  }, [user, fetchCartCount]);

  // Memoized values
  const isOrderPage = useMemo(() => {
    return location.pathname === '/order' || location.pathname === '/checkout';
  }, [location.pathname]);

  const isEmpty = useMemo(() => cartCount === 0, [cartCount]);

  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Memoized box shadows
  const emptyBoxShadow = useMemo(() => {
    return isLightTheme
      ? '0 4px 20px rgba(var(--bg-dark-rgb), 0.1), 0 0 0 1px rgba(var(--bg-dark-rgb), 0.05)'
      : '0 4px 20px rgba(var(--bg-dark-rgb), 0.3), 0 0 0 1px rgba(var(--text-main-rgb), 0.1)';
  }, [isLightTheme]);

  const filledBoxShadow = useMemo(() => {
    return isLightTheme
      ? '0 10px 40px rgba(var(--accent-rgb), 0.25), 0 0 0 1px rgba(var(--accent-rgb), 0.1)'
      : '0 10px 40px rgba(var(--bg-dark-rgb), 0.4), 0 0 0 1px rgba(var(--accent-rgb), 0.2)';
  }, [isLightTheme]);

  const cartLabel = useMemo(() => {
    if (isEmpty) return 'View cart (empty)';
    return `View cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`;
  }, [isEmpty, cartCount]);

  const cartText = useMemo(() => {
    if (isEmpty) return 'Empty';
    return `${cartCount} ${cartCount === 1 ? 'item' : 'items'}`;
  }, [isEmpty, cartCount]);

  const badgeText = useMemo(() => {
    return cartCount > 99 ? '99+' : String(cartCount);
  }, [cartCount]);

  // Don't render on order/checkout pages
  if (isOrderPage) {
    return null;
  }

  return (
    <>
      {/* Desktop Version - Top Right (Sticky on Scroll) */}
      <m.div
        className="hidden md:flex fixed top-6 right-6 z-[9999] pointer-events-auto"
        style={{ position: 'fixed' }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: -20 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8, y: -20 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Link
          to="/order"
          className={`group relative flex items-center gap-3 px-5 py-3.5 rounded-2xl font-semibold shadow-2xl transition-all duration-300 min-h-[56px] backdrop-blur-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
            isEmpty
              ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
              : 'bg-[var(--accent)] text-black border-[var(--accent)]/20 hover:shadow-[0_8px_30px_rgba(var(--accent-rgb),0.4)]'
          }`}
          style={{
            boxShadow: isEmpty ? emptyBoxShadow : filledBoxShadow
          }}
          aria-label={cartLabel}
        >
          {/* Cart Icon */}
          <m.svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            whileHover={prefersReducedMotion ? undefined : { rotate: [0, -10, 10, -10, 0] }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </m.svg>

          <div className="flex flex-col items-start">
            <span className="text-sm font-medium opacity-80 leading-tight">Cart</span>
            <span className="text-base font-bold leading-tight">
              {cartText}
            </span>
          </div>

          {/* Cart Count Badge - Only show when not empty */}
          {!isEmpty && (
            <m.span
              className="absolute -top-2 -right-2 bg-gradient-to-br from-[var(--color-red)] to-[var(--color-red)]/90 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white min-h-[44px] min-w-[44px]"
              aria-label={`${cartCount} items in cart`}
              initial={prefersReducedMotion ? undefined : { scale: 0 }}
              animate={prefersReducedMotion ? undefined : { scale: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.15 }}
            >
              {badgeText}
            </m.span>
          )}

          {/* Hover Glow Effect */}
          <m.div
            className="absolute inset-0 rounded-2xl bg-[var(--accent)] opacity-0 group-hover:opacity-20 blur-xl -z-10"
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            aria-hidden="true"
          />
        </Link>
      </m.div>

      {/* Mobile Version - Bottom Center */}
      <m.div
        className="md:hidden fixed bottom-4 left-4 right-4 z-[9999] pointer-events-auto"
        style={{ position: 'fixed' }}
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 100 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: 100 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Link
          to="/order"
          className={`group relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold shadow-2xl transition-all duration-300 min-h-[56px] backdrop-blur-sm border active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
            isEmpty
              ? 'bg-[var(--bg-elevated)] text-[var(--text-main)] border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
              : 'bg-[var(--accent)] text-black border-[var(--accent)]/20 hover:shadow-[0_8px_30px_rgba(var(--accent-rgb),0.4)]'
          }`}
          style={{
            boxShadow: isEmpty ? emptyBoxShadow : filledBoxShadow
          }}
          aria-label={cartLabel}
        >
          {/* Cart Icon */}
          <m.svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </m.svg>

          <span className="text-base">{isEmpty ? 'View Cart' : `View Cart (${cartCount})`}</span>

          {/* Cart Count Badge - Only show when not empty */}
          {!isEmpty && (
            <m.span
              className="absolute -top-2 -right-2 bg-gradient-to-br from-[var(--color-red)] to-[var(--color-red)]/90 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white min-h-[44px] min-w-[44px]"
              aria-label={`${cartCount} items in cart`}
              initial={prefersReducedMotion ? undefined : { scale: 0 }}
              animate={prefersReducedMotion ? undefined : { scale: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 1.1 }}
            >
              {badgeText}
            </m.span>
          )}

          {/* Hover Glow Effect */}
          <m.div
            className="absolute inset-0 rounded-2xl bg-[var(--accent)] opacity-0 group-active:opacity-20 blur-xl -z-10"
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            aria-hidden="true"
          />
        </Link>
      </m.div>
    </>
  );
};

export default FloatingCartButton;

