export interface RecentlyViewedItem {
  productId: string;
  itemType?: string;
  timestamp: number;
  [key: string]: unknown;
}

export function getRecentlyViewed(): RecentlyViewedItem[];
export function addToRecentlyViewed(productId: string, itemType?: string): void;
export function clearRecentlyViewed(): void;

