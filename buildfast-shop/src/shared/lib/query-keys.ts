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
   * Favorites-related query keys
   */
  favorites: {
    all: ['favorites'] as const,
    items: (userId: string | null) => [...queryKeys.favorites.all, 'items', userId] as const,
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

