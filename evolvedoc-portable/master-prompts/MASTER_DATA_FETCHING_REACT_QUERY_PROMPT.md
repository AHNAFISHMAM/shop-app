# 🔄 MASTER DATA FETCHING & REACT QUERY PROMPT
## Production-Grade Data Fetching, Caching, and State Management Workflow

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing data fetching with React Query (TanStack Query v5) in production applications for the **Star Café** application. It covers query patterns, mutations, cache management, optimistic updates, error handling, real-time synchronization, and performance optimization based on actual codebase implementations.

**Applicable to:**
- Data fetching hooks (`useQuery`, `useInfiniteQuery`)
- Data mutation hooks (`useMutation`)
- Cache management and invalidation
- Optimistic updates
- Real-time cache synchronization
- Error handling and retry logic
- Performance optimization
- Type-safe query implementations
- Guest and authenticated user data fetching
- Query key factory patterns

---

## 🎯 CORE PRINCIPLES

### 1. **Query Client Configuration**
- **Centralized Configuration**: Single `queryClient` instance with sensible defaults
- **Retry Logic**: Smart retry strategies (don't retry 4xx errors)
- **Stale Time**: Balance between freshness and performance
- **Cache Time**: Keep data in cache for reasonable duration
- **Network Mode**: Handle offline scenarios gracefully

### 2. **Query Key Management**
- **Hierarchical Keys**: Use arrays for hierarchical cache structure
- **Include Dependencies**: Include all variables that affect the query
- **Consistent Naming**: Use consistent naming conventions
- **Type Safety**: Use `as const` for query keys when possible

### 3. **Error Handling**
- **Always Handle Errors**: Never ignore errors
- **User-Friendly Messages**: Transform technical errors to user-friendly messages
- **Error Logging**: Log errors with context for debugging
- **Retry Strategy**: Retry transient errors, don't retry permanent failures

### 4. **Performance Optimization**
- **Selective Refetching**: Only refetch when necessary
- **Stale Time**: Use appropriate stale times to reduce unnecessary fetches
- **Cache Invalidation**: Invalidate related queries on mutations
- **Optimistic Updates**: Update UI immediately for better UX

---

## 🔍 PHASE 1: QUERY CLIENT SETUP

### Step 1.1: Query Client Configuration (Real Codebase Example)

**Actual Implementation from `src/lib/queryClient.ts`:**

```typescript
/**
 * React Query Client Configuration
 * Centralized configuration for data fetching, caching, and synchronization
 *
 * React Query v5 API:
 * - gcTime: Garbage collection time (replaces cacheTime)
 * - staleTime: Time before data is considered stale
 * - refetchOnWindowFocus: Whether to refetch on window focus
 * - retry: Number of retry attempts or function
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Create and configure React Query client
 *
 * Default options:
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - gcTime: 30 minutes - Unused data stays in cache for 30 minutes (v5 API)
 * - refetchOnWindowFocus: false - Don't refetch when window regains focus
 * - retry: Smart retry - Don't retry 4xx errors, retry others up to 2 times
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (v5 API - replaces cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when connection restored
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      networkMode: 'online', // Only fetch when online
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase()
          if (
            errorMessage.includes('401') ||
            errorMessage.includes('403') ||
            errorMessage.includes('404') ||
            errorMessage.includes('400') ||
            errorMessage.includes('4')
          ) {
            return false
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
})
```

**Query Configuration Presets (Real Codebase Example):**

**Actual Implementation from `src/shared/lib/query-config.ts`:**

```typescript
/**
 * React Query Configuration
 *
 * Default query and mutation configurations for React Query.
 * Provides consistent caching and retry strategies across the application.
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * Default query configuration
 */
export const defaultQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false, // Don't refetch on mount if data is fresh
  refetchOnReconnect: true,
  retry: (failureCount: number, error: Error) => {
    // Don't retry on 4xx errors (client errors)
    const errorMessage = error.message.toLowerCase()
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('404') ||
      errorMessage.includes('400') ||
      errorMessage.includes('4')
    ) {
      return false
    }
    // Retry up to 2 times for other errors
    return failureCount < 2
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  networkMode: 'online' as const,
} as const

/**
 * Default mutation configuration
 */
export const defaultMutationConfig = {
  retry: 1,
  retryDelay: 1000,
  networkMode: 'online' as const,
} as const

/**
 * Long-lived query configuration (for data that changes infrequently)
 */
export const longLivedQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 60 minutes
} as const

/**
 * Short-lived query configuration (for data that changes frequently)
 */
export const shortLivedQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 2 * 60 * 1000, // 2 minutes
  refetchOnWindowFocus: true,
} as const

/**
 * Real-time query configuration (for data that needs to be always fresh)
 */
export const realTimeQueryConfig = {
  ...defaultQueryConfig,
  staleTime: 0, // Always consider stale
  gcTime: 1 * 60 * 1000, // 1 minute
  refetchInterval: 30 * 1000, // Refetch every 30 seconds
  refetchOnWindowFocus: true,
} as const
```

**Key Implementation Details:**
- **React Query v5**: Uses `gcTime` instead of deprecated `cacheTime`
- **Smart Retry**: Doesn't retry 4xx errors (client errors)
- **Exponential Backoff**: Retry delay increases exponentially with max 30s
- **Preset Configs**: Provides different configs for different data freshness needs
- **Network Mode**: Only fetches when online

**Note:** For Supabase Realtime integration, use the `useRealtimeChannel` hook which automatically invalidates React Query cache on database changes. This provides better performance than polling with `refetchInterval`. The hook includes automatic reconnection, health checks, and proper cleanup. See [MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md](./MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md) for details.

### Step 1.2: Query Key Factory (Real Codebase Example)

**Actual Implementation from `src/shared/lib/query-keys.ts`:**

```typescript
/**
 * React Query Cache Keys
 *
 * Centralized cache key constants for React Query.
 * Ensures consistent cache key naming across the application.
 *
 * Usage:
 * ```typescript
 * import { queryKeys } from '../shared/lib/query-keys';
 *
 * useQuery({
 *   queryKey: queryKeys.menu.categories(),
 *   queryFn: getCategories
 * });
 * ```
 */

/**
 * Query key factory functions
 * Organized by feature/domain
 */
export const queryKeys = {
  /**
   * Menu-related query keys
   */
  menu: {
    all: ['menu'] as const,
    categories: () => [...queryKeys.menu.all, 'categories'] as const,
    category: (id: string) => [...queryKeys.menu.categories(), id] as const,
    subcategories: () => [...queryKeys.menu.all, 'subcategories'] as const,
    subcategory: (id: string) => [...queryKeys.menu.subcategories(), id] as const,
    items: () => [...queryKeys.menu.all, 'items'] as const,
    item: (id: string) => [...queryKeys.menu.items(), id] as const,
    sections: () => [...queryKeys.menu.all, 'sections'] as const,
    public: () => [...queryKeys.menu.all, 'public'] as const,
    search: (query: string) => [...queryKeys.menu.items(), 'search', query] as const,
  },

  /**
   * Cart-related query keys
   */
  cart: {
    all: ['cart'] as const,
    items: (userId: string | null) => [...queryKeys.cart.all, 'items', userId] as const,
    summary: (userId: string | null) => [...queryKeys.cart.all, 'summary', userId] as const,
  },

  /**
   * Order-related query keys
   */
  orders: {
    all: ['orders'] as const,
    list: (userId: string | null) => [...queryKeys.orders.all, 'list', userId] as const,
    order: (id: string) => [...queryKeys.orders.all, 'order', id] as const,
    history: (userId: string | null) => [...queryKeys.orders.all, 'history', userId] as const,
  },

  /**
   * User/Auth-related query keys
   */
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    profile: (userId: string) => [...queryKeys.auth.all, 'profile', userId] as const,
    admin: (userId: string) => [...queryKeys.auth.all, 'admin', userId] as const,
  },

  /**
   * Addresses-related query keys
   */
  addresses: {
    all: ['addresses'] as const,
    list: (userId: string | null) => [...queryKeys.addresses.all, 'list', userId] as const,
    address: (id: string) => [...queryKeys.addresses.all, 'address', id] as const,
  },

  /**
   * Reservations-related query keys
   */
  reservations: {
    all: ['reservations'] as const,
    list: (userId: string | null) => [...queryKeys.reservations.all, 'list', userId] as const,
    reservation: (id: string) => [...queryKeys.reservations.all, 'reservation', id] as const,
    settings: () => [...queryKeys.reservations.all, 'settings'] as const,
  },

  /**
   * Reviews-related query keys
   */
  reviews: {
    all: ['reviews'] as const,
    product: (productId: string) => [...queryKeys.reviews.all, 'product', productId] as const,
    menuItem: (menuItemId: string) => [...queryKeys.reviews.all, 'menuItem', menuItemId] as const,
    user: (userId: string) => [...queryKeys.reviews.all, 'user', userId] as const,
  },

  /**
   * Store settings-related query keys
   */
  settings: {
    all: ['settings'] as const,
    store: () => [...queryKeys.settings.all, 'store'] as const,
    featureFlags: () => [...queryKeys.settings.all, 'featureFlags'] as const,
  },

  /**
   * Admin-related query keys
   */
  admin: {
    all: ['admin'] as const,
    customers: () => [...queryKeys.admin.all, 'customers'] as const,
    customer: (id: string) => [...queryKeys.admin.customers(), id] as const,
    orders: () => [...queryKeys.admin.all, 'orders'] as const,
    order: (id: string) => [...queryKeys.admin.orders(), id] as const,
    menuItems: () => [...queryKeys.admin.all, 'menuItems'] as const,
    menuItem: (id: string) => [...queryKeys.admin.menuItems(), id] as const,
    categories: () => [...queryKeys.admin.all, 'categories'] as const,
    category: (id: string) => [...queryKeys.admin.categories(), id] as const,
  },
} as const
```

**Key Implementation Details:**
- **Hierarchical Structure**: Uses array spread for hierarchical keys
- **Type Safety**: Uses `as const` for type inference
- **Factory Functions**: Functions return properly typed keys
- **Feature Organization**: Organized by domain/feature
- **Consistent Naming**: Consistent naming conventions across all keys
- **User Scoping**: Includes user ID in keys for user-specific data

### Step 1.3: Query Client Checklist
- [ ] Query client configured with sensible defaults
- [ ] Retry logic handles 4xx errors correctly
- [ ] Stale time set appropriately
- [ ] Cache time (gcTime) set appropriately
- [ ] Network mode configured
- [ ] Refetch strategies configured
- [ ] Query key factory implemented
- [ ] Query key factory organized by feature
- [ ] Type safety ensured with `as const`

---

## 📊 PHASE 2: QUERY IMPLEMENTATION

### Step 2.1: Basic Query Pattern (Real Codebase Example)

**Actual Implementation from `src/features/addresses/hooks/use-addresses.js`:**

```javascript
/**
 * useAddresses Hook
 * 
 * Custom hook for fetching user addresses.
 * 
 * @returns {Object} Addresses, loading state, and error
 * 
 * @example
 * const { addresses, loading, error, refetch } = useAddresses(user);
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { fetchUserAddresses } from '../../../lib/addressesApi';
import { longLivedQueryConfig } from '../../../shared/lib/query-config';

/**
 * useAddresses Hook
 * 
 * Fetches and manages user addresses with React Query.
 * 
 * @param {Object} options - Hook options
 * @param {Object|null} options.user - Current user
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Addresses, loading state, and error
 */
export function useAddresses(options = {}) {
  const { user, enabled = true } = options;

  const {
    data: addressesResult,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.addresses.list(user?.id),
    queryFn: async () => {
      const result = await fetchUserAddresses(user.id);
      // Extract addresses from API response
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    },
    enabled: enabled && !!user,
    ...longLivedQueryConfig // Addresses change infrequently
  });

  return {
    addresses: addressesResult || [],
    loading: isLoading,
    error,
    refetch
  };
}
```

**Key Implementation Details:**
- **Query Key Factory**: Uses centralized `queryKeys` factory
- **Conditional Execution**: Uses `enabled` to conditionally run query
- **Config Presets**: Uses `longLivedQueryConfig` for infrequently changing data
- **Error Handling**: Returns empty array on error (graceful degradation)
- **Type Safety**: Properly typed return values

### Step 2.2: Query with Joins and Fallback (Real Codebase Example)

**Actual Implementation from `src/features/cart/hooks/use-cart-items.js`:**

```javascript
/**
 * Fetch cart items for authenticated user
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Cart items with product data
 */
async function fetchUserCartItems(userId) {
  try {
    // Try to fetch from cart_items table with joins
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
    return (data || []).map(item => ({
      ...item,
      // Map dishes to products for legacy support
      products: item.dishes || null,
      resolvedProduct: item.menu_items || item.dishes || null,
      resolvedProductType: item.menu_items ? 'menu_item' : item.dishes ? 'dish' : null
    }))
  } catch (error) {
    // Handle relationship errors
    if (error.code === 'PGRST116' || error.message?.includes('relationship')) {
      logger.warn('cart_items table relationships issue - trying without joins:', error.message);
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
          .from('menu_items')
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
        products: dish || null, // Legacy support
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
```

**Key Implementation Details:**
- **Fallback Strategy**: Handles relationship errors gracefully with fallback
- **Guest Support**: Supports both authenticated and guest users
- **Real-time Integration**: Subscribes to real-time changes and refetches
- **Error Resilience**: Returns empty array instead of throwing on table errors
- **Data Normalization**: Normalizes data structure for consistent consumption

### Step 2.3: Query with RPC Function and Fallback (Real Codebase Example)

**Actual Implementation from `src/features/menu/hooks/use-menu-data.ts`:**

```typescript
/**
 * Fetch menu data (categories and items)
 *
 * Uses get_public_menu() RPC function for optimized single-query fetching.
 * Falls back to separate queries if RPC is unavailable.
 *
 * @returns {Promise<MenuData>} Menu data with categories and items
 */
/**
 * RPC function response type for get_public_menu
 * ✅ CORRECT - Define proper types instead of using 'any'
 */
interface RPCCategoryResponse {
  category_id: string
  category_name: string
  category_order: number
  created_at?: string
  updated_at?: string
  dishes?: Array<{
    id: string
    name: string
    description?: string
    price: number
    images?: string[]
    is_active?: boolean
    [key: string]: unknown
  }>
  subcategories?: Array<{
    id: string
    name: string
    display_order: number
  }>
}

async function fetchMenuData(): Promise<MenuData> {
  try {
    // Try RPC function first (faster - 1 query instead of 2)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_menu')

    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      // ✅ CORRECT - Use proper type instead of 'any'
      const rpcCategories = rpcData as RPCCategoryResponse[]
      
      // Transform RPC response to match expected format
      const categories: MenuCategory[] = rpcCategories.map((cat) => ({
        id: cat.category_id,
        name: cat.category_name,
        sort_order: cat.category_order,
        slug: cat.category_name?.toLowerCase().replace(/\s+/g, '-'),
        created_at: cat.created_at || new Date().toISOString(),
        updated_at: cat.updated_at || new Date().toISOString(),
      }))

      // Flatten dishes from all categories
      const items: MenuItem[] = rpcCategories.flatMap((cat) => {
        const dishes = (cat.dishes || []).map((dish) => ({
          ...dish,
          category_id: cat.category_id,
          menu_categories: {
            id: cat.category_id,
            name: cat.category_name,
            slug: cat.category_name?.toLowerCase().replace(/\s+/g, '-'),
          },
        }))
        return dishes
      })

      return {
        categories: categories || [],
        items: items || [],
      }
    }

    // Fallback to separate queries if RPC fails or returns empty
    logger.warn('RPC get_public_menu failed or returned empty, falling back to separate queries:', rpcError)

    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order')

    if (categoriesError) {
      logError(categoriesError, 'fetchMenuData.categories')
      throw categoriesError
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
      .order('created_at', { ascending: false })

    if (itemsError) {
      logError(itemsError, 'fetchMenuData.items')
      throw itemsError
    }

    return {
      categories: (categoriesData as MenuCategory[]) || [],
      items: (itemsData as MenuItem[]) || [],
    }
  } catch (error) {
    logError(error, 'fetchMenuData')
    throw error
  }
}

/**
 * useMenuData Hook
 *
 * Fetches and manages menu data with React Query.
 *
 * @param {UseMenuDataOptions} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {UseMenuDataReturn} Menu data, loading state, and error
 */
export function useMenuData(options: UseMenuDataOptions = {}): UseMenuDataReturn {
  const { enabled = true } = options

  const {
    data: menuData,
    isLoading,
    error,
    refetch,
  }: UseQueryResult<MenuData, Error> = useQuery({
    queryKey: queryKeys.menu.public(),
    queryFn: fetchMenuData,
    enabled,
    ...defaultQueryConfig,
  })

  return {
    menuItems: menuData?.items || [],
    categories: menuData?.categories || [],
    loading: isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch()
    },
  }
}
```

**Key Implementation Details:**
- **RPC Optimization**: Uses RPC function for single-query fetching
- **Fallback Strategy**: Falls back to separate queries if RPC fails
- **Data Transformation**: Transforms RPC response to match expected format
- **Error Handling**: Comprehensive error handling with logging
- **Type Safety**: Properly typed with TypeScript interfaces

### Step 2.4: Query with Real-time Integration (Real Codebase Example)

**Actual Implementation from `src/features/products/hooks/use-product.ts`:**

```typescript
/**
 * useProduct Hook
 *
 * Fetches and manages product data with React Query.
 *
 * @param {string} productId - Product ID
 * @param {UseProductOptions} options - Query options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {UseProductReturn} Product, loading state, and error
 */
export function useProduct(productId: string | undefined, options: UseProductOptions = {}): UseProductReturn {
  const { enabled = true } = options

  const {
    data: productData,
    isLoading,
    error,
    refetch,
  }: UseQueryResult<ProductData, Error> = useQuery({
    queryKey: queryKeys.menu.item(productId || ''),
    queryFn: () => fetchProduct(productId!),
    enabled: enabled && !!productId,
    ...defaultQueryConfig,
  })

  // Real-time subscription for product updates
  useEffect(() => {
    if (!productId || !productData || !enabled) return

    const source = productData.source
    const channelName = source === 'menu_items' ? `menu-item-${productId}-changes` : `product-${productId}-changes`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: source,
          filter: `id=eq.${productId}`,
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId, productData, enabled, refetch])

  return {
    product: productData?.product || null,
    source: productData?.source || null,
    isMenuItem: productData?.isMenuItem || false,
    loading: isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch()
    },
  }
}
```

**Key Implementation Details:**
- **Real-time Updates**: Subscribes to product updates and refetches on change
- **Conditional Subscription**: Only subscribes when product data exists
- **Cleanup**: Properly cleans up subscription on unmount
- **Dynamic Channel Names**: Uses different channel names based on product source
- **Refetch on Update**: Refetches query when real-time update received

### Step 2.5: Query Options Best Practices

#### ✅ DO:
- Include all dependencies in query key
- Use `enabled` to conditionally run queries
- Set appropriate `staleTime` based on data freshness needs
- Handle errors with `logError`
- Return null/empty array for missing data
- Use TypeScript types from Database schema
- Use query key factory for consistency
- Use config presets (`defaultQueryConfig`, `longLivedQueryConfig`, etc.)
- Integrate real-time subscriptions for frequently changing data
- Implement fallback strategies for relationship errors

#### ❌ DON'T:
- Accept `user_id` as parameter (security risk)
- Ignore errors
- Use `staleTime: 0` for all queries (performance impact)
- Refetch on every mount (use `refetchOnMount: false`)
- Forget to handle null/undefined results
- Forget to clean up real-time subscriptions
- Use hardcoded query keys (use factory instead)

### Step 2.5: Query Checklist
- [ ] Query key includes all dependencies
- [ ] Error handling implemented
- [ ] TypeScript types used
- [ ] `enabled` option used when needed
- [ ] Appropriate `staleTime` set
- [ ] Appropriate `gcTime` set
- [ ] Retry logic configured
- [ ] User ID from auth context (not parameter)

---

## 🔄 PHASE 3: MUTATION IMPLEMENTATION

### Step 3.1: Basic Mutation Pattern (Real Codebase Example)

**Actual Implementation from `src/features/reservations/hooks/use-reservation-mutations.ts`:**

```typescript
/**
 * useReservationMutations Hook
 *
 * Custom hooks for reservation mutations (create).
 * Uses React Query mutations with proper cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { defaultMutationConfig } from '../../../shared/lib/query-config'
import {
  createReservation,
  type ReservationData,
  type ReservationResponse,
} from '../../../lib/reservationService'

/**
 * Create reservation mutation
 */
export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation<ReservationResponse, Error, ReservationData>({
    ...defaultMutationConfig,
    mutationFn: async (reservationData) => {
      return await createReservation(reservationData)
    },
    onSuccess: (data, variables) => {
      if (data.success && data.reservationId) {
        // Invalidate reservations list to refetch updated reservations
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.list(variables.userId || null) })
      }
    },
  })
}
```

**Order Creation Mutation (Real Codebase Example):**

**Actual Implementation from `src/features/orders/hooks/use-order-mutations.ts`:**

```typescript
/**
 * useOrderMutations Hook
 *
 * Custom hooks for order mutations (create).
 * Uses React Query mutations with proper cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { defaultMutationConfig } from '../../../shared/lib/query-config'
import { createOrder, type OrderData, type OrderResponse } from '../../../lib/orderService'

/**
 * Create order mutation
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation<OrderResponse, Error, OrderData>({
    ...defaultMutationConfig,
    mutationFn: async (orderData) => {
      return await createOrder(orderData)
    },
    onSuccess: (data, variables) => {
      if (data.success && data.orderId) {
        // Invalidate orders list to refetch updated orders
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.history(variables.userId) })
        // Invalidate cart since order was created from cart
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary(variables.userId) })
      }
    },
  })
}
```

**Key Implementation Details:**
- **Config Presets**: Uses `defaultMutationConfig` for consistency
- **Cache Invalidation**: Invalidates related queries on success
- **Multiple Invalidations**: Invalidates all related queries (orders, cart)
- **Type Safety**: Properly typed with TypeScript generics
- **Service Layer**: Uses service layer functions for business logic

### Step 3.2: Mutation with Optimistic Updates (Real Codebase Example)

**Actual Implementation from `src/features/cart/hooks/use-cart-mutations.ts`:**

```typescript
/**
 * Add menu item to cart mutation
 */
interface AddToCartVariables {
  menuItem: MenuItem
  userId: string
}

interface AddToCartContext {
  previousCartItems: CartItemWithProduct[] | undefined
  previousCartCount: number | undefined
}

export function useAddMenuItemToCart() {
  const queryClient = useQueryClient()

  return useMutation<CartOperationResult, Error, AddToCartVariables, AddToCartContext>({
    ...defaultMutationConfig,
    mutationFn: async ({ menuItem, userId }) => {
      return await addMenuItemToCart(menuItem, userId)
    },
    onMutate: async ({ menuItem, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items(userId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.summary(userId) })

      // Snapshot previous values
      const previousCartItems = queryClient.getQueryData<CartItemWithProduct[]>(
        queryKeys.cart.items(userId)
      )
      const previousCartCount = queryClient.getQueryData<number>(queryKeys.cart.summary(userId))

      // Optimistically update cart items
      if (previousCartItems) {
        const existingItem = previousCartItems.find((item) => item.menu_item_id === menuItem.id)
        if (existingItem) {
          // Update quantity if item exists
          const updatedItems = previousCartItems.map((item) =>
            item.id === existingItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
          queryClient.setQueryData(queryKeys.cart.items(userId), updatedItems)
        } else {
          // Add new item
          const newItem: CartItemWithProduct = {
            id: `temp-${Date.now()}`,
            user_id: userId,
            menu_item_id: menuItem.id,
            product_id: null,
            quantity: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            resolvedProduct: menuItem,
            resolvedProductType: 'menu_item',
            menu_items: menuItem,
          }
          queryClient.setQueryData(queryKeys.cart.items(userId), [...previousCartItems, newItem])
        }
      }

      // Optimistically update cart count
      if (previousCartCount !== undefined) {
        queryClient.setQueryData(queryKeys.cart.summary(userId), previousCartCount + 1)
      }

      return { previousCartItems, previousCartCount }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCartItems !== undefined) {
        queryClient.setQueryData(queryKeys.cart.items(variables.userId), context.previousCartItems)
      }
      if (context?.previousCartCount !== undefined) {
        queryClient.setQueryData(queryKeys.cart.summary(variables.userId), context.previousCartCount)
      }
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate to refetch and ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary(variables.userId) })
      }
    },
  })
}

/**
 * Update cart item quantity mutation
 */
interface UpdateQuantityVariables {
  cartItemId: string
  newQuantity: number
  userId: string
}

interface UpdateQuantityContext {
  previousCartItems: CartItemWithProduct[] | undefined
  previousCartCount: number | undefined
  quantityDiff: number
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation<
    { error: Error | null },
    Error,
    UpdateQuantityVariables,
    UpdateQuantityContext
  >({
    ...defaultMutationConfig,
    mutationFn: async ({ cartItemId, newQuantity, userId }) => {
      return await updateMenuItemQuantity(cartItemId, newQuantity, userId)
    },
    onMutate: async ({ cartItemId, newQuantity, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items(userId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.summary(userId) })

      // Snapshot previous values
      const previousCartItems = queryClient.getQueryData<CartItemWithProduct[]>(
        queryKeys.cart.items(userId)
      )
      const previousCartCount = queryClient.getQueryData<number>(queryKeys.cart.summary(userId))

      // Find the item being updated
      const itemToUpdate = previousCartItems?.find((item) => item.id === cartItemId)
      const oldQuantity = itemToUpdate?.quantity || 0
      const quantityDiff = newQuantity - oldQuantity

      // Optimistically update cart items
      if (previousCartItems && itemToUpdate) {
        const updatedItems = previousCartItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
        queryClient.setQueryData(queryKeys.cart.items(userId), updatedItems)
      }

      // Optimistically update cart count
      if (previousCartCount !== undefined) {
        queryClient.setQueryData(queryKeys.cart.summary(userId), previousCartCount + quantityDiff)
      }

      return { previousCartItems, previousCartCount, quantityDiff }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCartItems !== undefined) {
        queryClient.setQueryData(queryKeys.cart.items(variables.userId), context.previousCartItems)
      }
      if (context?.previousCartCount !== undefined) {
        queryClient.setQueryData(queryKeys.cart.summary(variables.userId), context.previousCartCount)
      }
    },
    onSuccess: (data, variables) => {
      if (!data.error) {
        // Invalidate to refetch and ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary(variables.userId) })
      }
    },
  })
}

/**
 * Remove cart item mutation
 */
interface RemoveCartItemVariables {
  cartItemId: string
  userId: string
}

interface RemoveCartItemContext {
  previousCartItems: CartItemWithProduct[] | undefined
  previousCartCount: number | undefined
  removedQuantity: number
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation<
    { error: Error | null },
    Error,
    RemoveCartItemVariables,
    RemoveCartItemContext
  >({
    ...defaultMutationConfig,
    mutationFn: async ({ cartItemId, userId }) => {
      return await removeMenuItemFromCart(cartItemId, userId)
    },
    onMutate: async ({ cartItemId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items(userId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.summary(userId) })

      // Snapshot previous values
      const previousCartItems = queryClient.getQueryData<CartItemWithProduct[]>(
        queryKeys.cart.items(userId)
      )
      const previousCartCount = queryClient.getQueryData<number>(queryKeys.cart.summary(userId))

      // Find the item being removed
      const itemToRemove = previousCartItems?.find((item) => item.id === cartItemId)
      const removedQuantity = itemToRemove?.quantity || 0

      // Optimistically remove item from cart
      if (previousCartItems) {
        const updatedItems = previousCartItems.filter((item) => item.id !== cartItemId)
        queryClient.setQueryData(queryKeys.cart.items(userId), updatedItems)
      }

      // Optimistically update cart count
      if (previousCartCount !== undefined) {
        queryClient.setQueryData(queryKeys.cart.summary(userId), previousCartCount - removedQuantity)
      }

      return { previousCartItems, previousCartCount, removedQuantity }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCartItems !== undefined) {
        queryClient.setQueryData(queryKeys.cart.items(variables.userId), context.previousCartItems)
      }
      if (context?.previousCartCount !== undefined) {
        queryClient.setQueryData(queryKeys.cart.summary(variables.userId), context.previousCartCount)
      }
    },
    onSuccess: (data, variables) => {
      if (!data.error) {
        // Invalidate to refetch and ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary(variables.userId) })
      }
    },
  })
}
```

**Key Implementation Details:**
- **Multiple Cache Updates**: Updates both cart items and cart summary
- **Quantity Tracking**: Tracks quantity differences for accurate count updates
- **Existing Item Handling**: Handles both new items and quantity updates
- **Temporary IDs**: Uses temporary IDs for optimistic updates
- **Rollback on Error**: Properly rolls back all optimistic updates on error
- **Invalidation on Success**: Invalidates queries to ensure consistency

### Step 3.3: When to Use Optimistic Updates

**Always Use Optimistic Updates For:**
- Toggle actions (favorite, like, complete)
- Quick actions (mark as read, delete)
- User-initiated changes (profile updates, settings)
- Actions with high success probability

**Example: Profile Update with Optimistic Update**
```typescript
export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: ProfileUpdate): Promise<Profile> => {
      if (!user?.id) throw new Error('User not authenticated')
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        logError(error, 'useUpdateProfile')
        throw error
      }

      return data as Profile
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile', user?.id] })

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(['profile', user?.id])

      // Optimistically update
      if (user?.id && previousProfile) {
        queryClient.setQueryData(['profile', user.id], (old: Profile) => ({
          ...old,
          ...updates,
        }))
      }

      return { previousProfile }
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousProfile && user?.id) {
        queryClient.setQueryData(['profile', user.id], context.previousProfile)
      }
      toast.error(getUserFriendlyError(error))
    },
    onSuccess: (data) => {
      // Update with server response
      if (user?.id) {
        queryClient.setQueryData(['profile', user.id], data)
      }
      toast.success('Profile updated!')
    },
  })
}
```

**Optimistic Update Checklist:**
- [ ] `onMutate` cancels outgoing queries
- [ ] `onMutate` snapshots previous state
- [ ] `onMutate` optimistically updates cache
- [ ] `onError` rolls back on failure
- [ ] `onSuccess` updates with server response
- [ ] Error handling with user-friendly messages

### Step 3.4: Mutation with Multiple Cache Updates
```typescript
export function useUpdateWeddingBudget() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: WeddingBudgetUpdate): Promise<WeddingBudget> => {
      if (!user?.id) throw new Error('User not authenticated')
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('wedding_budgets')
        .upsert(
          {
            user_id: user.id,
            ...updates,
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single()

      if (error) {
        logError(error, 'useUpdateWeddingBudget')
        throw error
      }

      return data as WeddingBudget
    },
    onSuccess: () => {
      // Invalidate multiple related queries
      queryClient.invalidateQueries({ queryKey: ['wedding-budget', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['progress-stats', user?.id] })
      toast.success('Wedding budget saved! 💒')
    },
    onError: (error: Error) => {
      toast.error(getUserFriendlyError(error))
    },
  })
}
```

### Step 3.5: Mutation Best Practices

#### ✅ DO:
- Update cache on success
- Use optimistic updates for better UX
- Invalidate related queries
- Handle errors gracefully
- Show user feedback (toast notifications)
- Rollback optimistic updates on error

#### ❌ DON'T:
- Ignore errors
- Forget to update cache
- Skip optimistic updates for instant feedback
- Invalidate too many queries (performance impact)
- Show technical error messages to users

### Step 3.6: Mutation Checklist
- [ ] Error handling implemented
- [ ] Cache updated on success
- [ ] Related queries invalidated
- [ ] Optimistic updates (if applicable)
- [ ] Rollback on error (if optimistic)
- [ ] User feedback (toast notifications)
- [ ] User ID from auth context (not parameter)

---

## 🔄 PHASE 4: CACHE MANAGEMENT

### Step 4.1: Cache Invalidation Patterns

#### Pattern 1: Invalidate Single Query
```typescript
queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
```

#### Pattern 2: Invalidate All Queries with Prefix
```typescript
queryClient.invalidateQueries({ queryKey: ['resources'] })
// Invalidates all queries starting with ['resources']
```

#### Pattern 3: Invalidate Multiple Related Queries
```typescript
// After updating budget, invalidate related stats
queryClient.invalidateQueries({ queryKey: ['budget', user?.id] })
queryClient.invalidateQueries({ queryKey: ['progress-stats', user?.id] })
```

#### Pattern 4: Update Cache Directly
```typescript
// Update cache without refetching
queryClient.setQueryData(['profile', user.id], (old) => ({
  ...old,
  first_name: newFirstName,
}))
```

### Step 4.2: Cache Invalidation Checklist
- [ ] Related queries invalidated on mutations
- [ ] Cache updated directly when appropriate
- [ ] Not invalidating too many queries (performance)
- [ ] Invalidation happens in `onSuccess` callback
- [ ] Real-time updates trigger invalidation

---

## ⚡ PHASE 5: PERFORMANCE OPTIMIZATION

### Step 5.1: Stale Time Strategy
```typescript
// Frequently changing data - short stale time
staleTime: 0, // Always refetch

// Moderately changing data - medium stale time
staleTime: 60000, // 1 minute

// Rarely changing data - long stale time
staleTime: 5 * 60 * 1000, // 5 minutes
```

### Step 5.2: Selective Refetching
```typescript
// Don't refetch on mount if data is fresh
refetchOnMount: false

// Don't refetch on window focus
refetchOnWindowFocus: false

// Refetch when connection restored
refetchOnReconnect: true
```

### Step 5.3: Query Key Optimization
```typescript
// ✅ CORRECT - Include all dependencies
queryKey: ['resources', user?.id, filter, sortBy]

// ❌ WRONG - Missing dependencies
queryKey: ['resources', user?.id]
```

### Step 5.4: Performance Checklist
- [ ] Appropriate stale times set
- [ ] Selective refetching configured
- [ ] Query keys include all dependencies
- [ ] Not refetching unnecessarily
- [ ] Cache invalidation optimized
- [ ] Optimistic updates used where appropriate

---

## 🔄 PHASE 6: REAL-TIME CACHE SYNCHRONIZATION

### Step 6.1: Real-time Integration in Queries (Real Codebase Example)

**Actual Implementation from `src/features/cart/hooks/use-cart-items.js`:**

```javascript
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
```

**Product Real-time Integration (Real Codebase Example):**

**Actual Implementation from `src/features/products/hooks/use-product.ts`:**

```typescript
export function useProduct(productId: string | undefined, options: UseProductOptions = {}): UseProductReturn {
  const { enabled = true } = options

  const {
    data: productData,
    isLoading,
    error,
    refetch,
  }: UseQueryResult<ProductData, Error> = useQuery({
    queryKey: queryKeys.menu.item(productId || ''),
    queryFn: () => fetchProduct(productId!),
    enabled: enabled && !!productId,
    ...defaultQueryConfig,
  })

  // Real-time subscription for product updates
  useEffect(() => {
    if (!productId || !productData || !enabled) return

    const source = productData.source
    const channelName = source === 'menu_items' ? `menu-item-${productId}-changes` : `product-${productId}-changes`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: source,
          filter: `id=eq.${productId}`,
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId, productData, enabled, refetch])

  return {
    product: productData?.product || null,
    source: productData?.source || null,
    isMenuItem: productData?.isMenuItem || false,
    loading: isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch()
    },
  }
}
```

**Key Implementation Details:**
- **Conditional Subscription**: Only subscribes when data exists and query is enabled
- **Dynamic Channel Names**: Uses different channel names based on data source
- **Event Filtering**: Filters to specific events (UPDATE) and records (id=eq.X)
- **Cleanup**: Properly cleans up subscriptions on unmount
- **Refetch on Change**: Refetches query when real-time update received
- **Guest Support**: Skips real-time for guest users

### Step 6.2: Real-time Checklist
- [ ] Channel cleanup on unmount
- [ ] Conditional subscription (only when data exists)
- [ ] Filter to user's data only
- [ ] Dynamic channel names based on data source
- [ ] Event filtering (specific events and records)
- [ ] Refetch on real-time updates
- [ ] Guest user support (skip real-time)
- [ ] Error handling for connection issues

---

## 🎯 SUCCESS CRITERIA

A React Query implementation is complete when:

1. ✅ **Query Client**: Configured with sensible defaults and config presets
2. ✅ **Query Keys**: Centralized factory with hierarchical structure
3. ✅ **Queries**: All queries properly typed, error handled, and use query key factory
4. ✅ **Mutations**: Mutations update cache, invalidate related queries, and use optimistic updates
5. ✅ **Optimistic Updates**: Used where appropriate for better UX with proper rollback
6. ✅ **Error Handling**: All errors handled with user-friendly messages and logging
7. ✅ **Performance**: Appropriate stale times, config presets, and selective refetching
8. ✅ **Real-time**: Real-time updates trigger cache invalidation with proper cleanup
9. ✅ **Type Safety**: Full TypeScript coverage with Database types
10. ✅ **Security**: User ID from auth context, not parameters
11. ✅ **Guest Support**: Handles both authenticated and guest users
12. ✅ **Fallback Strategies**: Handles relationship errors and missing tables gracefully

---

## 🚨 COMMON PITFALLS

### ❌ Don't:
- Accept `user_id` as parameter (security risk)
- Ignore errors
- Refetch on every mount
- Invalidate too many queries (performance impact)
- Skip optimistic updates for instant feedback
- Forget to clean up real-time subscriptions
- Use `staleTime: 0` for all queries
- Use hardcoded query keys (use factory instead)
- Forget to handle guest users
- Throw errors on missing tables (return empty arrays instead)
- Ignore relationship errors (implement fallback strategies)

### ✅ Do:
- Use user.id from auth context
- Handle all errors with logging and user-friendly messages
- Use appropriate stale times and config presets
- Invalidate related queries only (not all queries)
- Use optimistic updates for instant feedback
- Clean up real-time subscriptions on unmount
- Use query key factory for consistency
- Support both authenticated and guest users
- Implement fallback strategies for relationship errors
- Return empty arrays instead of throwing on missing tables
- Use config presets (`defaultQueryConfig`, `longLivedQueryConfig`, etc.)

---

## 📚 RELATED GUIDES

- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** — Database schema and queries
- **🔄 [MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md](./MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md)** — Real-time patterns
- **⚠️ [MASTER_ERROR_HANDLING_LOGGING_PROMPT.md](./MASTER_ERROR_HANDLING_LOGGING_PROMPT.md)** — Error handling patterns
- **🎣 [MASTER_CUSTOM_HOOKS_PROMPT.md](./MASTER_CUSTOM_HOOKS_PROMPT.md)** — Custom hook patterns

---

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

### Version 1.1 - 2025-01-20
**Trigger:** Database Schema Alignment Fixes
**Changes:**
- Updated table name reference: `dishes` → `menu_items` (line 543)
**Files Changed:** Query example updated to match actual Supabase schema
**Pattern:** Database queries must use correct table names to prevent runtime errors

---

**This master prompt should be followed for ALL React Query data fetching work in the Star Café application. All examples are based on actual codebase implementations.**

