import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { addToGuestCart } from '../lib/guestSessionUtils';
import toast from 'react-hot-toast';
import { generatePlaceholderImage } from '../lib/imageUtils';
import { SEO } from '../components/SEO';
import { logger } from '../utils/logger';
// New hooks
import { useMenuData } from '../features/menu/hooks';
import { useCartCount } from '../features/cart/hooks';
import { useTheme } from '../shared/hooks';
// Import components
import MenuSearchBar from '../components/menu/MenuSearchBar';
import ProductCard from '../components/menu/ProductCard';
import CollapsibleSidebar from '../components/menu/CollapsibleSidebar';
import MenuReservationDrawer from '../components/MenuReservationDrawer';
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

const ITEMS_PER_BATCH = 12;
const QUICK_REORDER_STORAGE_KEY = 'menu_quick_reorder_items';

const MenuPage = () => {
  // Theme detection using shared hook
  const isLightTheme = useTheme();

  // State management
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [allergenFilters, setAllergenFilters] = useState([]);
  const [quickReorderItems, setQuickReorderItems] = useState([]);

  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const contentRef = useRef(null);
  const searchBarRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Feature flags - default to false during loading to prevent showing features that should be hidden
  const enableReservations = settingsLoading ? false : (settings?.enable_reservations ?? true);
  const enableMenuFilters = settingsLoading ? false : (settings?.enable_menu_filters ?? true);
  const enableQuickReorder = settingsLoading ? false : (settings?.enable_quick_reorder ?? true);
  const enableCustomization = settingsLoading ? false : (settings?.enable_product_customization ?? true);

  // Data fetching using new hooks
  const { menuItems, categories, loading, error: menuError } = useMenuData();
  const { cartCount } = useCartCount({ user });

  // Show error toast if menu fetch fails
  useEffect(() => {
    if (menuError) {
      logger.error('Error fetching menu:', menuError);
      toast.error('Failed to load menu');
    }
  }, [menuError]);

  const scrollMenuToTop = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      if (searchBarRef.current?.scrollIntoView) {
        searchBarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }, []);

  const registerQuickReorderItem = useCallback((item) => {
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
      const raw = JSON.parse(localStorage.getItem(QUICK_REORDER_STORAGE_KEY) || '[]');
      if (Array.isArray(raw) && raw.length > 0) {
        const resolved = raw
          .map((entry) => menuItems.find((item) => item.id === entry.id))
          .filter(Boolean);
        if (resolved.length > 0) {
          setQuickReorderItems(resolved.slice(0, 3));
        }
      }
    } catch (error) {
      logger.error('Error loading quick reorder items:', error);
    }
  }, [menuItems]);

  const allDietaryTags = useMemo(() => {
    const tags = new Map();
    menuItems.forEach((item) => {
      const itemTags = item?.dietary_tags || item?.dietaryTags || [];
      if (Array.isArray(itemTags)) {
        itemTags.forEach((tag) => {
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
    const tags = new Map();
    menuItems.forEach((item) => {
      let allergenSource = [];
      if (Array.isArray(item?.allergens)) {
        allergenSource = item.allergens;
      } else if (Array.isArray(item?.allergen_tags)) {
        allergenSource = item.allergen_tags;
      } else if (typeof item?.allergen_info === 'string') {
        allergenSource = item.allergen_info.split(',').map((value) => value.trim());
      }

      allergenSource.forEach((tag) => {
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

    return menuItems.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const descriptionMatch = item.description?.toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || descriptionMatch;

      const matchesCategory = !selectedCategory || item.category_id === selectedCategory.id;

      const itemDietary = Array.isArray(item?.dietary_tags)
        ? item.dietary_tags.map((tag) => tag?.toLowerCase())
        : Array.isArray(item?.dietaryTags)
          ? item.dietaryTags.map((tag) => tag?.toLowerCase())
          : [];

      const matchesDietary = dietaryFilters.length === 0 ||
        dietaryFilters.every((tag) => itemDietary.includes(tag.toLowerCase()));

      let itemAllergens = [];
      if (Array.isArray(item?.allergens)) {
        itemAllergens = item.allergens;
      } else if (Array.isArray(item?.allergen_tags)) {
        itemAllergens = item.allergen_tags;
      } else if (typeof item?.allergen_info === 'string') {
        itemAllergens = item.allergen_info.split(',').map((value) => value.trim());
      }
      const normalizedAllergens = itemAllergens.map((tag) => tag?.toLowerCase());

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
    return menuItems.filter(item => item.is_featured).slice(0, 3);
  }, [menuItems]);

  // Add to cart handler
  const handleAddToCart = useCallback(async (item) => {
    try {
      if (user) {
        // Check if item already in cart
        const { data: existing } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('menu_item_id', item.id)
          .single();

        if (existing) {
          // Update quantity
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Insert new item
          const { error } = await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              menu_item_id: item.id,
              quantity: 1,
            });

          if (error) throw error;
        }
      } else {
        // Guest user - add to localStorage
        addToGuestCart(item, 1, { isMenuItem: true });
      }

      // Cart count is automatically updated by useCartCount hook
      // (real-time subscription for authenticated users, polling for guest users)
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
  const handleCategoryClick = useCallback((category) => {
    if (!category || selectedCategory?.id === category?.id) {
      // Deselect if clicking the same category
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
    scrollMenuToTop();
  }, [selectedCategory, scrollMenuToTop]);

  // Handle search change - memoized
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  // Get image URL with fallback - memoized to prevent recreating function
  const getImageUrl = useCallback((item) => {
    if (item.image_url) {
      return item.image_url;
    }
    // Generate placeholder
    return generatePlaceholderImage(item.name);
  }, []);

  const handleDietaryToggle = useCallback((tag) => {
    const normalized = tag.toLowerCase();
    setDietaryFilters((prev) => (
      prev.includes(normalized)
        ? prev.filter((existing) => existing !== normalized)
        : [...prev, normalized]
    ));
  }, []);

  const handleAllergenToggle = useCallback((tag) => {
    const normalized = tag.toLowerCase();
    setAllergenFilters((prev) => (
      prev.includes(normalized)
        ? prev.filter((existing) => existing !== normalized)
        : [...prev, normalized]
    ));
  }, []);

  const handleQuickReorder = useCallback((itemId) => {
    const catalogItem = menuItems.find((item) => item.id === itemId);
    if (catalogItem) {
      handleAddToCart(catalogItem);
      return;
    }

    const storedItem = quickReorderItems.find((item) => item.id === itemId);
    if (storedItem) {
      handleAddToCart(storedItem);
    }
  }, [menuItems, quickReorderItems, handleAddToCart]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems, searchQuery, selectedCategory]);

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
    const batches = [];
    for (let i = 0; i < chefsPicks.length; i += 3) {
      batches.push(chefsPicks.slice(i, i + 3));
    }
    return batches;
  }, [chefsPicks]);

  const itemBatches = useMemo(() => {
    const batches = [];
    for (let i = 0; i < itemsToRender.length; i += 3) {
      batches.push(itemsToRender.slice(i, i + 3));
    }
    return batches;
  }, [itemsToRender]);

  if (loading) {
    return (
      <motion.main
        className="space-y-10"
        variants={pageFade}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Loading Skeleton - Using ProductCardSkeleton component */}
        <motion.div
          className="text-center space-y-4 py-12"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="h-8 rounded w-64 mx-auto animate-pulse"
            variants={fadeSlideUp}
            style={{
              backgroundColor: 'var(--bg-hover)'
            }}
          />
          <motion.div
            className="h-4 rounded w-96 mx-auto animate-pulse"
            variants={fadeSlideUp}
            style={{
              backgroundColor: 'var(--bg-hover)'
            }}
          />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={gridReveal}
          initial="hidden"
          animate="visible"
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="rounded-2xl overflow-hidden border border-theme animate-pulse"
              variants={batchFadeSlideUp}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div 
                className="h-48"
                style={{
                  backgroundColor: isLightTheme 
                    ? 'rgba(0, 0, 0, 0.08)' 
                    : 'rgba(255, 255, 255, 0.1)'
                }}
              />
              <div className="p-4 space-y-3">
                <div 
                  className="h-4 rounded w-3/4"
                  style={{
                    backgroundColor: isLightTheme 
                      ? 'rgba(0, 0, 0, 0.08)' 
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                />
                <div 
                  className="h-3 rounded w-full"
                  style={{
                    backgroundColor: isLightTheme 
                      ? 'rgba(0, 0, 0, 0.08)' 
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                />
                <div 
                  className="h-10 rounded-full"
                  style={{
                    backgroundColor: isLightTheme 
                      ? 'rgba(0, 0, 0, 0.08)' 
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.main>
    );
  }

  return (
    <>
      <SEO 
        title="Menu"
        description="Browse our complete menu featuring signature biryanis, family set menus, appetizers, and desserts. Order online or dine in at Star Café."
        keywords="menu, biryani, restaurant menu, order online, Star Café menu"
      />
      <motion.main
      className="space-y-6 relative overflow-visible"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="absolute inset-0 pointer-events-none -z-10"
        variants={pageBackdrop}
        initial="hidden"
        animate="visible"
        exit="exit"
        aria-hidden="true"
      />

      {/* Search Bar Component */}
      <motion.div
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
      </motion.div>

      <motion.div
        className="rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        custom={0.2}
      >
        <motion.div className="space-y-1" variants={fadeSlideUp}>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-muted">Skip the queue</p>
          <p className="text-sm text-[var(--text-main)]/80 leading-relaxed">
            Book a table and stage your cart before you arrive.
          </p>
        </motion.div>
        <motion.div
          className="flex flex-wrap gap-2 sm:gap-3"
          variants={fadeSlideUp}
        >
          <button
            type="button"
            onClick={() => setReservationDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-black transition hover:bg-[var(--accent)]/90 active:scale-95 min-h-[44px]"
          >
            Reserve &amp; Pre-Order
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={scrollMenuToTop}
            className="inline-flex items-center gap-2 rounded-xl border border-theme-strong bg-theme-elevated px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-main)]/80 transition hover:border-theme-medium hover:text-[var(--text-main)] min-h-[44px]"
          >
            Browse Menu
          </button>
        </motion.div>
      </motion.div>

      {/* Mobile Sidebar Toggle Button */}
      <motion.div
        className="lg:hidden"
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        custom={0.25}
      >
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-theme text-[var(--text-main)] transition-colors min-h-[44px]"
          style={{
            backgroundColor: isLightTheme 
              ? 'rgba(0, 0, 0, 0.04)' 
              : 'rgba(255, 255, 255, 0.05)',
            borderColor: 'var(--border-default)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isLightTheme 
              ? 'rgba(0, 0, 0, 0.08)' 
              : 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isLightTheme 
              ? 'rgba(0, 0, 0, 0.04)' 
              : 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="font-medium">Browse Categories</span>
          {selectedCategory && (
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
              {selectedCategory.name}
            </span>
          )}
        </button>
      </motion.div>

      {/* Main Layout: Sidebar + Content */}
      <motion.div
        className="flex gap-4 sm:gap-6 items-start overflow-visible"
        variants={menuStagger}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Desktop Sidebar */}
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
              <motion.div
                className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  backgroundColor: 'var(--modal-backdrop)'
                }}
                onClick={() => setMobileSidebarOpen(false)}
              />

              {/* Slide-in Sidebar */}
              <motion.div
                data-overlay-scroll
                className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[var(--bg-main)] z-50 lg:hidden shadow-2xl overflow-y-auto"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="p-4 border-b border-theme flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--text-main)]">Menu Categories</h2>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <CollapsibleSidebar
                  categories={categories}
                  menuItems={menuItems}
                  selectedCategory={selectedCategory}
                  onCategorySelect={(cat) => {
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
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <motion.div
          ref={contentRef}
          className="flex-1 min-w-0 space-y-8"
          variants={fadeSlideUp}
          custom={0.32}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Chef's Picks Section */}
          {!searchQuery && !selectedCategory && chefsPicks.length > 0 && (
            <motion.section
              variants={fadeSlideUp}
              custom={0.38}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mb-4 sm:mb-6">⭐ Chef&apos;s Picks</h2>
              {chefBatches.map((batch, batchIndex) => {
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
                  <motion.div
                    key={`chef-batch-${batchIndex}`}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    {...batchMotionProps}
                  >
                    {batch.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={batchFadeSlideUp}
                        layout
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
                      </motion.div>
                    ))}
                  </motion.div>
                );
              })}
            </motion.section>
          )}

          {/* Products Grid */}
          <motion.section
            className="min-h-[400px] transition-all duration-700 ease-out"
            style={{
              background: selectedCategory
                ? `radial-gradient(circle at 50% 20%, rgba(197, 157, 95, 0.08), transparent 70%)`
                : 'transparent'
            }}
            variants={fadeSlideUp}
            custom={0.46}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {filteredItems.length === 0 ? (
              // Empty State
              <motion.div
                className="flex flex-col items-center justify-center py-20"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={0.58}
              >
                <motion.svg
                  className="w-24 h-24 text-muted/30 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  variants={fadeSlideUp}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </motion.svg>
                <motion.p
                  className="text-lg text-muted mb-2"
                  variants={fadeSlideUp}
                >
                  No dishes found
                </motion.p>
                <motion.p
                  className="text-sm text-muted/70 mb-4"
                  variants={fadeSlideUp}
                >
                  Try adjusting your filters or search
                </motion.p>
                <motion.button
                  onClick={() => {
                    handleSearchChange('');
                    setSelectedCategory(null);
                    setDietaryFilters([]);
                    setAllergenFilters([]);
                    scrollMenuToTop();
                  }}
                  className="btn-outline text-sm px-4 py-3 min-h-[44px]"
                  variants={fadeSlideUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Clear Filters
                </motion.button>
              </motion.div>
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
                  <motion.div
                    key={`items-batch-${batchIndex}`}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    {...batchMotionProps}
                  >
                    {batch.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={batchFadeSlideUp}
                        layout
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
                      </motion.div>
                    ))}
                  </motion.div>
                );
              })}
              </>
            )}
            {hasMoreItems && (
              <div ref={loadMoreRef} className="h-6" aria-hidden="true" />
            )}
          </motion.section>
        </motion.div>
      </motion.div>

      {enableReservations && (
        <MenuReservationDrawer
          open={reservationDrawerOpen}
          onClose={() => setReservationDrawerOpen(false)}
          cartCount={cartCount}
        />
      )}
    </motion.main>
    </>
  );
};

export default MenuPage;
