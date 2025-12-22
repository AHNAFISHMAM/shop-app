export declare function addFavorite(targetId: string, userId: string, options?: {
    isMenuItem?: boolean;
}): Promise<{
    success: boolean;
    data: any | null;
    error: string | null;
}>;
export declare function removeFavorite(targetId: string, userId: string, options?: {
    isMenuItem?: boolean;
}): Promise<{
    success: boolean;
    error: string | null;
}>;
export declare function toggleFavorites(targetId: string, userId: string, options?: {
    isMenuItem?: boolean;
}): Promise<{
    success: boolean;
    data: any | null;
    error: string | null;
    action: 'added' | 'removed';
}>;
export declare function fetchUserFavorites(userId: string): Promise<{
    success: boolean;
    data: any[] | null;
    error: string | null;
}>;
export declare function isInFavorites(targetId: string, userId: string, options?: {
    isMenuItem?: boolean;
}): Promise<boolean>;
export declare function getFavoriteItems(userId: string): Promise<any[]>;
export declare function getFavoritesCount(userId: string): Promise<number>;
export declare function removeFavorite(favoriteId: string, userId: string): Promise<{
    success: boolean;
    error: string | null;
}>;
