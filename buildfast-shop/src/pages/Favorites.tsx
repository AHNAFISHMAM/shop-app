import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getFavoriteItems, removeFavorite } from '../lib/favoritesUtils';
import { addProductToCart, addMenuItemToCart } from '../lib/cartUtils';
import { handleAuthError } from '../lib/authUtils';
import { parsePrice, formatPrice } from '../lib/priceUtils';
import FavoriteCommentsPanel from '../components/FavoriteCommentsPanel';
import FavoriteCard from '../components/favorites/FavoriteCard';
import EmptyFavoritesState from '../components/favorites/EmptyFavoritesState';
import { m } from 'framer-motion';
import { pageFade, staggerContainer } from '../components/animations/menuAnimations';
import { logger } from '../utils/logger';

/**
 * Interface for favorite item structure
 */
interface FavoriteItem {
  id: string;
  menu_item_id?: string | null;
  product_id?: string | null;
  product?: Product | null;
  menu_item?: Product | null;
}

/**
 * Interface for product structure
 */
interface Product {
  id: string;
  name: string;
  price: number | string;
  currency?: string;
  image_url?: string;
  images?: string[];
  is_available?: boolean;
  stock_quantity?: number;
  [key: string]: unknown;
}

/**
 * Favorites Page - Star Cafe
 *
 * Displays all favorite dishes saved by the customer.
 * Shows stock status and allows moving items to cart for quick ordering.
 *
 * @component
 */
const Favorites = memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [isLightTheme, setIsLightTheme] = useState<boolean>(false);
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList): void => {
      setPrefersReducedMotion('matches' in e ? e.matches : mediaQuery.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return undefined;
  }, []);

  // Detect theme preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTheme = () => {
      const isLight = document.documentElement.classList.contains('light') ||
        (!document.documentElement.classList.contains('dark') &&
         window.matchMedia('(prefers-color-scheme: light)').matches);
      setIsLightTheme(isLight);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const fetchFavorites = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getFavoriteItems(user.id);

      if (result.success) {
        setFavoriteItems((result.data || []) as FavoriteItem[]);
      } else if (result.error) {
        const wasAuthError = await handleAuthError(result.error, navigate);
        if (!wasAuthError) {
          logger.error('Error fetching favorites:', result.error);
          setError('Failed to load favorites. Please try again.');
        }
      }
    } catch (err: unknown) {
      logger.error('Error fetching favorites:', err);
      const wasAuthError = await handleAuthError(
        err as Error | { code?: string; message?: string } | null,
        navigate
      );
      if (!wasAuthError) {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/favorites' } } });
      return;
    }

    fetchFavorites();

    // Set up realtime subscription
    const channel = supabase
      .channel('favorite-dishes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchFavorites();
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          logger.warn('Favorites subscription error:', err);
        }
        if (status === 'TIMED_OUT') {
          logger.warn('Favorites subscription timed out');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, navigate, fetchFavorites]);

  const handleRemove = useCallback(
    async (favoriteId: string): Promise<void> => {
      if (!user) return;

      try {
        await removeFavorite(favoriteId, user.id);
        setFavoriteItems((prev) => prev.filter((item) => item.id !== favoriteId));
      } catch (err: unknown) {
        logger.error('Error removing favorite:', err);
        setError('Failed to remove favorite. Please try again.');
      }
    },
    [user]
  );

  // Cleanup all timeouts on component unmount
  useEffect(() => {
    const currentTimeouts = timeoutRefs.current;
    return () => {
      Object.values(currentTimeouts).forEach((timeoutId) => {
        if (timeoutId) clearTimeout(timeoutId);
      });
    };
  }, []);

  // Memoize processed favorites
  const processedFavorites = useMemo(() => {
    return favoriteItems
      .map((item) => {
        const isMenuItem = !!item.menu_item_id;
        const product = isMenuItem ? item.menu_item : item.product;

        if (!product || !product.id || !product.name) {
          return null;
        }

        return {
          id: item.id,
          product_id: item.product_id,
          menu_item_id: item.menu_item_id,
          product: isMenuItem ? null : product,
          menu_item: isMenuItem ? product : null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [favoriteItems]);

  if (loading) {
    return (
      <m.main
        className="min-h-screen bg-[var(--bg-main)] py-24 text-center text-[var(--text-main)]"
        variants={prefersReducedMotion ? {} : pageFade}
        initial={prefersReducedMotion ? undefined : 'hidden'}
        animate={prefersReducedMotion ? undefined : 'visible'}
        style={{ 
          pointerEvents: 'auto',
          // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
          paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
          paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
          // Ensure no overflow constraints that break positioning
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        }}
        role="main"
        aria-label="Favorites page"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="app-container space-y-6">
          <div
            className="inline-flex h-14 w-14 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-3xl font-semibold">My Favorites</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Loading your saved dishes...</p>
          </div>
        </div>
      </m.main>
    );
  }

  return (
    <m.main
      className="min-h-screen bg-[var(--bg-main)] pb-16 pt-10 text-[var(--text-main)] sm:pt-12"
      variants={prefersReducedMotion ? {} : pageFade}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      style={{ 
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      }}
      role="main"
      aria-label="Favorites page"
    >
      <section
        className="app-container space-y-6 sm:space-y-8"
        aria-labelledby="favorites-heading"
      >
        <m.div
          className="glow-surface glow-soft flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.03)] px-4 py-4 shadow-[0_35px_65px_-55px_rgba(var(--accent-rgb),0.65)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:px-6 sm:py-6"
          variants={prefersReducedMotion ? {} : pageFade}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] sm:text-sm">
              Saved Dishes
            </p>
            <h1
              id="favorites-heading"
              className="flex items-center gap-3 text-xl font-semibold sm:text-2xl md:text-3xl"
            >
              <svg
                className="h-6 w-6 text-[var(--accent)] sm:h-8 sm:w-8"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              My Favorites
            </h1>
            <p className="text-xs text-[var(--text-muted)] sm:text-sm">
              {favoriteItems.length === 0
                ? 'No favorite dishes yet'
                : `${favoriteItems.length} favorite dish${favoriteItems.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <Link
            to="/menu"
            className="btn-primary min-h-[44px] inline-flex items-center justify-center whitespace-nowrap px-5 py-3"
            aria-label="Browse menu to add more favorites"
          >
            Browse Menu
          </Link>
        </m.div>

        {error && (
          <m.div
            className="rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-4 py-3 text-sm text-[var(--color-red)]"
            role="alert"
            aria-live="assertive"
            variants={prefersReducedMotion ? {} : pageFade}
            initial={prefersReducedMotion ? undefined : 'hidden'}
            animate={prefersReducedMotion ? undefined : 'visible'}
          >
            {error}
          </m.div>
        )}

        <FavoriteCommentsPanel favoriteItems={favoriteItems} userId={user?.id} />

        {favoriteItems.length === 0 ? (
          <EmptyFavoritesState />
        ) : (
          <m.ul
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3"
            role="list"
            aria-label="Favorite dishes"
            variants={prefersReducedMotion ? {} : staggerContainer}
            initial={prefersReducedMotion ? undefined : 'hidden'}
            animate={prefersReducedMotion ? undefined : 'visible'}
          >
            {processedFavorites.map((favorite, index) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                index={index}
                onRemove={handleRemove}
              />
            ))}
          </m.ul>
        )}
      </section>
    </m.main>
  );
});

Favorites.displayName = 'Favorites';

export default Favorites;
