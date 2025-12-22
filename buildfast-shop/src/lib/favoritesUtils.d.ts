/**
 * Type declarations for favorites utilities
 */
export interface FavoriteOptions {
  isMenuItem?: boolean;
}

export interface FavoriteResult {
  success: boolean;
  error?: string | null;
  code?: string;
}

export function addToFavorites(targetId: string, userId: string, options?: FavoriteOptions): Promise<FavoriteResult>;
export function removeFromFavorites(targetId: string, userId: string, options?: FavoriteOptions): Promise<FavoriteResult>;
export function getUserFavorites(userId: string): Promise<{ data: any[] | null; error: string | null }>;
export function isFavorite(targetId: string, userId: string, options?: FavoriteOptions): Promise<boolean>;

