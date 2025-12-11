/**
 * React Query Cache Keys
 * 
 * Centralized cache key constants for React Query.
 * Ensures consistent cache key naming across the application.
 * 
 * Usage:
 * ```javascript
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
    all: ['menu'],
    categories: () => [...queryKeys.menu.all, 'categories'],
    category: (id) => [...queryKeys.menu.categories(), id],
    subcategories: () => [...queryKeys.menu.all, 'subcategories'],
    subcategory: (id) => [...queryKeys.menu.subcategories(), id],
    items: () => [...queryKeys.menu.all, 'items'],
    item: (id) => [...queryKeys.menu.items(), id],
    sections: () => [...queryKeys.menu.all, 'sections'],
    public: () => [...queryKeys.menu.all, 'public'],
    search: (query) => [...queryKeys.menu.items(), 'search', query],
  },

  /**
   * Cart-related query keys
   */
  cart: {
    all: ['cart'],
    items: (userId) => [...queryKeys.cart.all, 'items', userId],
    summary: (userId) => [...queryKeys.cart.all, 'summary', userId],
  },

  /**
   * Order-related query keys
   */
  orders: {
    all: ['orders'],
    list: (userId) => [...queryKeys.orders.all, 'list', userId],
    order: (id) => [...queryKeys.orders.all, 'order', id],
    history: (userId) => [...queryKeys.orders.all, 'history', userId],
  },

  /**
   * User/Auth-related query keys
   */
  auth: {
    all: ['auth'],
    user: () => [...queryKeys.auth.all, 'user'],
    profile: (userId) => [...queryKeys.auth.all, 'profile', userId],
    admin: (userId) => [...queryKeys.auth.all, 'admin', userId],
  },

  /**
   * Favorites-related query keys
   */
  favorites: {
    all: ['favorites'],
    items: (userId) => [...queryKeys.favorites.all, 'items', userId],
  },

  /**
   * Addresses-related query keys
   */
  addresses: {
    all: ['addresses'],
    list: (userId) => [...queryKeys.addresses.all, 'list', userId],
    address: (id) => [...queryKeys.addresses.all, 'address', id],
  },

  /**
   * Reservations-related query keys
   */
  reservations: {
    all: ['reservations'],
    list: (userId) => [...queryKeys.reservations.all, 'list', userId],
    reservation: (id) => [...queryKeys.reservations.all, 'reservation', id],
    settings: () => [...queryKeys.reservations.all, 'settings'],
  },

  /**
   * Reviews-related query keys
   */
  reviews: {
    all: ['reviews'],
    product: (productId) => [...queryKeys.reviews.all, 'product', productId],
    menuItem: (menuItemId) => [...queryKeys.reviews.all, 'menuItem', menuItemId],
    user: (userId) => [...queryKeys.reviews.all, 'user', userId],
  },

  /**
   * Store settings-related query keys
   */
  settings: {
    all: ['settings'],
    store: () => [...queryKeys.settings.all, 'store'],
    featureFlags: () => [...queryKeys.settings.all, 'featureFlags'],
  },

  /**
   * Admin-related query keys
   */
  admin: {
    all: ['admin'],
    customers: () => [...queryKeys.admin.all, 'customers'],
    customer: (id) => [...queryKeys.admin.customers(), id],
    orders: () => [...queryKeys.admin.all, 'orders'],
    order: (id) => [...queryKeys.admin.orders(), id],
    menuItems: () => [...queryKeys.admin.all, 'menuItems'],
    menuItem: (id) => [...queryKeys.admin.menuItems(), id],
    categories: () => [...queryKeys.admin.all, 'categories'],
    category: (id) => [...queryKeys.admin.categories(), id],
  },
};

