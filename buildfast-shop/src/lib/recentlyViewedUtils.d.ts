/**
 * Type declarations for recently viewed utilities
 */
export interface RecentlyViewedEntry {
  productId: string;
  itemType?: 'product' | 'menu_item';
  timestamp: number;
}

export function getRecentlyViewed(): RecentlyViewedEntry[];
export function addToRecentlyViewed(productId: string, itemType?: 'product' | 'menu_item'): void;
export function clearRecentlyViewed(): void;

