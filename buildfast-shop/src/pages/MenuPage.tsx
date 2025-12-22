import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence, type Variants } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { addToGuestCart } from '../lib/guestSessionUtils';
import toast from 'react-hot-toast';
import { generatePlaceholderImage } from '../lib/imageUtils';
import { SEO } from '../components/SEO';
import { logger } from '../utils/logger';
import { useMenuData } from '../features/menu/hooks';
import { useCartCount } from '../features/cart/hooks';
import { useTheme } from '../shared/hooks';
import MenuSearchBar from '../components/menu/MenuSearchBar';
import ProductCard from '../components/menu/ProductCard';
import CollapsibleSidebar from '../components/menu/CollapsibleSidebar';
import MenuReservationDrawer from '../components/MenuReservationDrawer';
import MenuPageSkeleton from '../components/menu/MenuPageSkeleton';
import EmptyMenuState from '../components/menu/EmptyMenuState';
import ChefsPicksSection from '../components/menu/ChefsPicksSection';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  pageFade,
  pageBackdrop,
  searchBarSequence,
  menuStagger,
  fadeSlideUp,
  batchFadeSlideUp,
  gridReveal,
  staggerContainer
} from '../components/animations/menuAnimations';

/**
 * Menu Item Interface
 */
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  category_id: string;
  is_featured?: boolean;
  dietary_tags?: string[];
  dietaryTags?: string[];
  allergens?: string[];
  allergen_tags?: string[];
  allergen_info?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Category Interface
 */
interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_BATCH = 12;
const QUICK_REORDER_STORAGE_KEY = 'menu_quick_reorder_items';

/**
 * Cart Item Interface
 */
interface CartItem {
  id: string;
  quantity: number;
  [key: string]: unknown;
}

/**
 * MenuPage Component
 * 
 * Main menu browsing page with search, filtering, categories, and product display.
 * Fully accessible and WCAG 2.1 AA compliant.
 * 
 * @remarks
 * - Uses design system CSS variables
 * - Mobile-first responsive design
 * - Supports reduced motion preferences
 * - All touch targets meet 44px minimum
 * - Infinite scroll with intersection observer
 */
const MenuPage = memo(() => {
  // Theme detection using shared hook
  const isLightTheme = useTheme();

  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // State management
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_BATCH);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [allergenFilters, setAllergenFilters] = useState<string[]>([]);
  const [quickReorderItems, setQuickReorderItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const contentRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);

  // Focus trap for mobile sidebar
  useFocusTrap(mobileSidebarOpen, mobileSidebarRef);

  // Reduced motion observer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    
    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Feature flags - default to false during loading to prevent showing features that should be hidden
  const enableReservations = useMemo(
    () => settingsLoading ? false : (settings?.enable_reservations ?? true),
    [settingsLoading, settings?.enable_reservations]
  );
  const enableMenuFilters = useMemo(
    () => settingsLoading ? false : (settings?.enable_menu_filters ?? true),
    [settingsLoading, settings?.enable_menu_filters]
  );
  const enableQuickReorder = useMemo(
    () => settingsLoading ? false : (settings?.enable_quick_reorder ?? true),
    [settingsLoading, settings?.enable_quick_reorder]
  );
  const enableCustomization = useMemo(
    () => settingsLoading ? false : (settings?.enable_product_customization ?? true),
    [settingsLoading, settings?.enable_product_customization]
  );

  // Data fetching using new hooks
  const { menuItems, categories, loading, error: menuError } = useMenuData();
  const { cartCount } = useCartCount({ user });

  // Show error toast and state if menu fetch fails
  useEffect(() => {
    if (menuError) {
      logger.error('Error fetching menu:', menuError);
      setError('Failed to load menu. Please refresh the page.');
      toast.error('Failed to load menu');
    } else {
      setError(null);
    }
  }, [menuError]);

  const scrollMenuToTop = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      if (searchBarRef.current?.scrollIntoView) {
        searchBarRef.current.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  }, [prefersReducedMotion]);

  const registerQuickReorderItem = useCallback((item: MenuItem): void => {
    setQuickReorderItems((prev) => {
      const existing = prev.filter((entry) => entry.id !== item.id);
      const next = [item, ...existing].slice(0, 3);

      if (typeof window !== 'undefined') {
        try {
          const payload = next.map((entry) => ({ id: entry.id }));
          localStorage.setItem(QUICK_REORDER_STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
          logger.error('Error persisting quick reorder items:', error);
        }
      }

      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !menuItems.length) return;

    try {
      const raw = localStorage.getItem(QUICK_REORDER_STORAGE_KEY);
      if (!raw) return;
      
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const resolved = parsed
        .map((entry: { id?: string }) => {
          if (!entry || typeof entry !== 'object' || !entry.id) return null;
          return menuItems.find((item: MenuItem) => item.id === entry.id);
        })
        .filter((item): item is MenuItem => Boolean(item));
      
      if (resolved.length > 0) {
        setQuickReorderItems(resolved.slice(0, 3));
      }
    } catch (error) {
      logger.error('Error loading quick reorder items:', error);
      // Clear invalid data
      try {
        localStorage.removeItem(QUICK_REORDER_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }, [menuItems]);

  const allDietaryTags = useMemo(() => {
    const tags = new Map<string, string>();
    menuItems.forEach((item: MenuItem) => {
      const itemTags = item?.dietary_tags || item?.dietaryTags || [];
      if (Array.isArray(itemTags)) {
        itemTags.forEach((tag: string) => {
          if (!tag) return;
          const key = tag.toLowerCase();
          if (!tags.has(key)) {
            tags.set(key, tag);
          }
        });
      }
    });
    return Array.from(tags.values()).sort((a, b) => a.localeCompare(b));
  }, [menuItems]);

  const allAllergens = useMemo(() => {
    const tags = new Map<string, string>();
    menuItems.forEach((item: MenuItem) => {
      let allergenSource: string[] = [];
      if (Array.isArray(item?.allergens)) {
        allergenSource = item.allergens;
      } else if (Array.isArray(item?.allergen_tags)) {
        allergenSource = item.allergen_tags;
      } else if (typeof item?.allergen_info === 'string') {
        allergenSource = item.allergen_info.split(',').map((value: string) => value.trim());
      }

      allergenSource.forEach((tag: string) => {
        if (!tag) return;
        const key = tag.toLowerCase();
        if (!tags.has(key)) {
          tags.set(key, tag);
        }
      });
    });
    return Array.from(tags.values()).sort((a, b) => a.localeCompare(b));
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery ? searchQuery.toLowerCase() : '';

    return menuItems.filter((item: MenuItem) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const descriptionMatch = item.description?.toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || descriptionMatch;

      const matchesCategory = !selectedCategory || item.category_id === selectedCategory.id;

      const itemDietary = Array.isArray(item?.dietary_tags)
        ? item.dietary_tags.map((tag: string) => tag?.toLowerCase())
        : Array.isArray(item?.dietaryTags)
          ? item.dietaryTags.map((tag: string) => tag?.toLowerCase())
          : [];

      const matchesDietary = dietaryFilters.length === 0 ||
        dietaryFilters.every((tag: string) => itemDietary.includes(tag.toLowerCase()));

      let itemAllergens: string[] = [];
      if (Array.isArray(item?.allergens)) {
        itemAllergens = item.allergens;
      } else if (Array.isArray(item?.allergen_tags)) {
        itemAllergens = item.allergen_tags;
      } else if (typeof item?.allergen_info === 'string') {
        itemAllergens = item.allergen_info.split(',').map((value: string) => value.trim());
      }
      const normalizedAllergens = itemAllergens.map((tag: string) => tag?.toLowerCase());

      const matchesAllergens = allergenFilters.length === 0 ||
        !normalizedAllergens.some((tag) => allergenFilters.includes(tag));

      return matchesSearch && matchesCategory && matchesDietary && matchesAllergens;
    });
  }, [menuItems, searchQuery, selectedCategory, dietaryFilters, allergenFilters]);

  const totalFilteredCount = filteredItems.length;

  const itemsToRender = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const hasMoreItems = visibleCount < totalFilteredCount;

  // Get chef's picks (featured items) - memoized
  const chefsPicks = useMemo(() => {
    return menuItems.filter((item: MenuItem) => item.is_featured).slice(0, 3);
  }, [menuItems]);

  // Add to cart handler
  const handleAddToCart = useCallback(async (item: MenuItem): Promise<void> => {
    try {
      if (user) {
        // Check if item already in cart
        const { data: existing, error: queryError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('menu_item_id', item.id)
          .maybeSingle();

        if (queryError && queryError.code !== 'PGRST116') {
          throw queryError;
        }

        if (existing) {
          // Type-safe quantity handling
          const existingCartItem = existing as CartItem;
          const currentQuantity = typeof existingCartItem.quantity === 'number' ? existingCartItem.quantity : 0;
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: currentQuantity + 1 })
            .eq('id', existingCartItem.id);

          if (updateError) throw updateError;
        } else {
          // Insert new item
          const { error: insertError } = await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              menu_item_id: item.id,
              quantity: 1,
            });

          if (insertError) throw insertError;
        }
      } else {
        // Guest user - add to localStorage
        addToGuestCart(item, 1, { isMenuItem: true });
      }

      // Cart count is automatically updated by useCartCount hook
      if (enableQuickReorder) {
        registerQuickReorderItem(item);
      }

      // Show success toast
      toast.success(`${item.name} added to cart!`, {
        icon: '🛒',
        duration: 2000,
      });

    } catch (error) {
      logger.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  }, [user, registerQuickReorderItem, enableQuickReorder]);

  // Handle category selection
  const handleCategoryClick = useCallback((category: Category | null) => {
    if (!category || selectedCategory?.id === category?.id) {
      // Deselect if clicking the same category
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
    scrollMenuToTop();
  }, [selectedCategory, scrollMenuToTop]);

  // Handle search change - memoized
  const handleSearchChange = useCallback((value: string): void => {
    setSearchQuery(value);
  }, []);

  // Get image URL with fallback - memoized to prevent recreating function
  const getImageUrl = useCallback((item: MenuItem): string => {
    if (item.image_url) {
      return item.image_url;
    }
    // Generate placeholder
    return generatePlaceholderImage(item.name);
  }, []);

  const handleDietaryToggle = useCallback((tag: string): void => {
    const normalized = tag.toLowerCase();
    setDietaryFilters((prev) => (
      prev.includes(normalized)
        ? prev.filter((existing) => existing !== normalized)
        : [...prev, normalized]
    ));
  }, []);

  const handleAllergenToggle = useCallback((tag: string): void => {
    const normalized = tag.toLowerCase();
    setAllergenFilters((prev) => (
      prev.includes(normalized)
        ? prev.filter((existing) => existing !== normalized)
        : [...prev, normalized]
    ));
  }, []);

  const handleQuickReorder = useCallback((itemId: string): void => {
    const catalogItem = menuItems.find((item: MenuItem) => item.id === itemId);
    if (catalogItem) {
      handleAddToCart(catalogItem);
      return;
    }

    const storedItem = quickReorderItems.find((item) => item.id === itemId);
    if (storedItem) {
      handleAddToCart(storedItem);
    }
  }, [menuItems, quickReorderItems, handleAddToCart]);

  const handleClearFilters = useCallback(() => {
    handleSearchChange('');
    setSelectedCategory(null);
    setDietaryFilters([]);
    setAllergenFilters([]);
    scrollMenuToTop();
  }, [handleSearchChange, scrollMenuToTop]);

  useEffect(() => {
    const initialCount = totalFilteredCount > 0
      ? Math.min(ITEMS_PER_BATCH, totalFilteredCount)
      : ITEMS_PER_BATCH;

    setVisibleCount((prev) => {
      // Only reset if filters changed, not on every totalFilteredCount change
      if (prev === 0 || prev > totalFilteredCount) {
        return initialCount;
      }
      return prev;
    });
  }, [menuItems, searchQuery, selectedCategory, totalFilteredCount]);

  useEffect(() => {
    if (!hasMoreItems) return;

    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => {
              if (prev >= totalFilteredCount) return prev;
              return Math.min(prev + ITEMS_PER_BATCH, totalFilteredCount);
            });
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreItems, totalFilteredCount]);

  const chefBatches = useMemo(() => {
    const batches: MenuItem[][] = [];
    for (let i = 0; i < chefsPicks.length; i += 3) {
      batches.push(chefsPicks.slice(i, i + 3));
    }
    return batches;
  }, [chefsPicks]);

  const itemBatches = useMemo(() => {
    const batches: MenuItem[][] = [];
    for (let i = 0; i < itemsToRender.length; i += 3) {
      batches.push(itemsToRender.slice(i, i + 3));
    }
    return batches;
  }, [itemsToRender]);

  // Animation variants with reduced motion support
  const animationVariants: Variants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }
    return pageFade;
  }, [prefersReducedMotion]);

  if (loading) {
    return <MenuPageSkeleton isLightTheme={isLightTheme} prefersReducedMotion={prefersReducedMotion} />;
  }

  return (
    <>
      <SEO 
        title="Menu"
        description="Browse our complete menu featuring signature biryanis, family set menus, appetizers, and desserts. Order online or dine in at Star Café."
        keywords="menu, biryani, restaurant menu, order online, Star Café menu"
      />
      {/* Main container - NO Framer Motion to prevent transform issues with sticky sidebar */}
      <main
        className="space-y-6 relative overflow-visible"
        style={{ 
          pointerEvents: 'auto',
          transform: 'none',
          willChange: 'auto',
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        }}
        role="main"
        aria-label="Menu page"
        aria-live="polite"
      >
        <m.div
          className="absolute inset-0 pointer-events-none -z-10"
          variants={pageBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-hidden="true"
        />

        {/* Error Display */}
        {error && (
          <m.div
            className="rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-4 py-3 text-sm text-[var(--color-red)]"
            role="alert"
            aria-live="assertive"
            variants={prefersReducedMotion ? {} : fadeSlideUp}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate={prefersReducedMotion ? false : 'visible'}
          >
            {error}
          </m.div>
        )}

        {/* Search Bar Component */}
        <m.div
          ref={searchBarRef}
          variants={searchBarSequence}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <MenuSearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        </m.div>

        <m.div
          className="rounded-xl sm:rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          custom={0.2}
          role="region"
          aria-labelledby="reservation-cta-heading"
        >
          <m.div className="space-y-1" variants={fadeSlideUp}>
            <p className="text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[var(--text-secondary)]">Skip the queue</p>
            <p id="reservation-cta-heading" className="text-sm text-[var(--text-main)]/80 leading-relaxed">
              Book a table and stage your cart before you arrive.
            </p>
          </m.div>
          <m.div
            className="flex flex-wrap gap-2 sm:gap-3"
            variants={fadeSlideUp}
          >
            <Link
              to="/reservations"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[var(--accent)]/90 active:scale-95 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Reserve a table and pre-order items"
            >
              Reserve &amp; Pre-Order
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={scrollMenuToTop}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)]/80 transition hover:border-[var(--border-default)] hover:text-[var(--text-main)] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Scroll to top of menu"
            >
              Browse Menu
            </button>
          </m.div>
        </m.div>

        {/* Mobile Sidebar Toggle Button */}
        <m.div
          className="lg:hidden"
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          custom={0.25}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--border-default)] text-[var(--text-main)] transition-colors min-h-[44px] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            aria-label="Open menu categories sidebar"
            aria-expanded={mobileSidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-medium">Browse Categories</span>
            {selectedCategory && (
              <span className="ml-auto text-sm px-2 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]" aria-label={`Selected category: ${selectedCategory.name}`}>
                {selectedCategory.name}
              </span>
            )}
          </button>
        </m.div>

        {/* Main Layout: Sidebar + Content */}
        {/* Sidebar is outside .app-container to avoid overflow constraints breaking sticky positioning */}
        <div
          className="flex gap-4 sm:gap-6 items-start overflow-visible"
          style={{
            position: 'relative', // Ensure proper positioning context
            minHeight: '100vh', // Ensure parent has enough height for sticky
            transform: 'none !important', // Force no transforms - critical for sticky sidebar
            willChange: 'auto !important', // Force no will-change - critical for sticky sidebar
            overflow: 'visible',
            overflowX: 'visible',
            overflowY: 'visible',
            // Add padding to match .app-container spacing (prevents sidebar from touching viewport edges)
            paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
            paddingRight: 'clamp(1rem, 3vw, 3.5rem)'
          }}
          onWheel={(e) => {
            logger.log('[MenuPage Debug] Wheel event:', {
              deltaY: e.deltaY,
              target: e.target,
              currentTarget: e.currentTarget,
              scrollY: window.scrollY
            });
          }}
        >
          {/* Desktop Sidebar - outside .app-container to avoid containing block issues */}
          <CollapsibleSidebar
            categories={categories}
            menuItems={menuItems}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategoryClick}
            variant="desktop"
            enableFilters={enableMenuFilters}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            dietaryTags={allDietaryTags}
            activeDietaryTags={dietaryFilters}
            onDietaryToggle={handleDietaryToggle}
            allergenTags={allAllergens}
            activeAllergenTags={allergenFilters}
            onAllergenToggle={handleAllergenToggle}
            quickReorderItems={enableQuickReorder ? quickReorderItems : []}
            onQuickReorder={enableQuickReorder ? handleQuickReorder : null}
          />

          {/* Mobile Sidebar Drawer */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <>
                {/* Backdrop */}
                <m.div
                  className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
                  style={{
                    backgroundColor: 'var(--modal-backdrop)'
                  }}
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-hidden="true"
                />

                {/* Slide-in Sidebar */}
                <m.div
                  ref={mobileSidebarRef}
                  id="mobile-sidebar"
                  data-overlay-scroll
                  className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[var(--bg-main)] z-50 lg:hidden shadow-2xl overflow-y-auto hide-scrollbar"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: 'easeOut' }}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mobile-sidebar-heading"
                >
                  <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between">
                    <h2 id="mobile-sidebar-heading" className="text-lg font-semibold text-[var(--text-main)]">Menu Categories</h2>
                    <button
                      onClick={() => setMobileSidebarOpen(false)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                      aria-label="Close menu categories sidebar"
                    >
                      <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <CollapsibleSidebar
                    categories={categories}
                    menuItems={menuItems}
                    selectedCategory={selectedCategory}
                    onCategorySelect={(cat: Category | null) => {
                      handleCategoryClick(cat);
                      setMobileSidebarOpen(false);
                    }}
                    variant="mobile"
                    enableFilters={enableMenuFilters}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    dietaryTags={allDietaryTags}
                    activeDietaryTags={dietaryFilters}
                    onDietaryToggle={handleDietaryToggle}
                    allergenTags={allAllergens}
                    activeAllergenTags={allergenFilters}
                    onAllergenToggle={handleAllergenToggle}
                    quickReorderItems={enableQuickReorder ? quickReorderItems : []}
                    onQuickReorder={enableQuickReorder ? handleQuickReorder : null}
                  />
                </m.div>
              </>
            )}
          </AnimatePresence>

          {/* Main Content Area - wrapped in .app-container for proper width constraints */}
          <div className="app-container flex-1 min-w-0">
            <m.div
              ref={contentRef}
              className="space-y-8"
              variants={fadeSlideUp}
              custom={0.32}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-live="polite"
              aria-atomic="false"
            >
            {/* Chef's Picks Section */}
            {!searchQuery && !selectedCategory && chefsPicks.length > 0 && (
              <ChefsPicksSection
                chefsPicks={chefsPicks}
                chefBatches={chefBatches}
                onAddToCart={handleAddToCart}
                getImageUrl={getImageUrl}
                enableCustomization={enableCustomization}
                prefersReducedMotion={prefersReducedMotion}
              />
            )}

            {/* Products Grid */}
            <m.section
              className="min-h-[400px] transition-all duration-700 ease-out"
              style={{
                background: selectedCategory
                  ? `radial-gradient(circle at 50% 20%, rgba(var(--accent-rgb), 0.08), transparent 70%)`
                  : 'transparent'
              }}
              variants={fadeSlideUp}
              custom={0.46}
              initial="hidden"
              animate="visible"
              exit="exit"
              aria-labelledby="menu-items-heading"
            >
              <h2 id="menu-items-heading" className="sr-only">Menu Items</h2>
              {filteredItems.length === 0 ? (
                <EmptyMenuState
                  onClearFilters={handleClearFilters}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ) : (
                <>
                {itemBatches.map((batch, batchIndex) => {
                  const batchMotionProps = batchIndex === 0
                    ? {
                        initial: 'hidden',
                        animate: 'visible',
                        variants: gridReveal,
                        exit: 'exit',
                      }
                    : {
                        initial: 'hidden',
                        variants: gridReveal,
                        whileInView: 'visible',
                        viewport: { once: true, amount: 0.25, margin: '40px 0px 0px 0px' },
                        exit: 'exit',
                      };

                  return (
                    <m.div
                      key={`items-batch-${batchIndex}`}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                      {...batchMotionProps}
                    >
                      {batch.map((item) => (
                        <m.div
                          key={item.id}
                          variants={batchFadeSlideUp}
                          layout={!prefersReducedMotion}
                          initial="hidden"
                          animate={batchIndex === 0 ? 'visible' : undefined}
                          whileInView={batchIndex === 0 ? undefined : 'visible'}
                          viewport={
                            batchIndex === 0
                              ? undefined
                              : { once: true, amount: 0.25, margin: '40px 0px 0px 0px' }
                          }
                          exit="exit"
                        >
                          <ProductCard
                            product={item}
                            onAddToCart={handleAddToCart}
                            getImageUrl={getImageUrl}
                            enableCustomization={enableCustomization}
                          />
                        </m.div>
                      ))}
                    </m.div>
                  );
                })}
                </>
              )}
              {hasMoreItems && (
                <div ref={loadMoreRef} className="h-6" aria-hidden="true" aria-label="Loading more items" />
              )}
            </m.section>
            </m.div>
          </div>
        </div>

        {enableReservations && (
          <MenuReservationDrawer
            open={reservationDrawerOpen}
            onClose={() => setReservationDrawerOpen(false)}
            cartCount={cartCount}
          />
        )}
      </main>
    </>
  );
});

MenuPage.displayName = 'MenuPage';

export default MenuPage;

