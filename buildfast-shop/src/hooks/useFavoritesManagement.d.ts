export interface User {
  id: string;
  [key: string]: unknown;
}

export interface UseFavoritesManagementReturn {
  favoriteItems: Set<string>;
  togglingFavorites: Record<string, boolean>;
  toggleFavorite: (itemId: string, isMenuItem?: boolean) => Promise<void>;
  isFavorite: (itemId: string, isMenuItem?: boolean) => boolean;
  isLoading: boolean;
}

export function useFavoritesManagement(user: User | null): UseFavoritesManagementReturn;

