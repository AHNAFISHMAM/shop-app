/**
 * Type declarations for useFavoritesManagement hook
 */
export interface UseFavoritesManagementReturn {
  favoriteItems: Set<string>;
  togglingFavorites: Record<string, boolean>;
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (itemId: string, isMenuItem?: boolean) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

export function useFavoritesManagement(user: { id: string } | null): UseFavoritesManagementReturn;

