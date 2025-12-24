export interface FavoriteResult {
  success: boolean
  error?: string
  code?: string
}

export interface FavoriteItem {
  id: string
  user_id: string
  menu_item_id?: string | null
  product_id?: string | null
  [key: string]: unknown
}

export function addToFavorites(
  targetId: string,
  userId: string,
  options?: { isMenuItem?: boolean }
): Promise<FavoriteResult>
export function removeFromFavorites(
  targetId: string,
  userId: string,
  options?: { isMenuItem?: boolean }
): Promise<FavoriteResult>
export function isInFavorites(
  targetId: string,
  userId: string,
  options?: { isMenuItem?: boolean }
): Promise<boolean>
export function toggleFavorites(
  targetId: string,
  userId: string,
  options?: { isMenuItem?: boolean }
): Promise<FavoriteResult>
export function getFavoriteItems(userId: string): Promise<FavoriteItem[]>
export function getFavoritesCount(userId: string): Promise<number>
export function removeFavorite(favoriteId: string, userId: string): Promise<FavoriteResult>
