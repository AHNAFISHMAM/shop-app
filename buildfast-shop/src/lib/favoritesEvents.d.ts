/**
 * Type declarations for favorites events
 */
export function emitFavoritesChanged(): void;
export function onFavoritesChanged(callback: () => void): () => void;

