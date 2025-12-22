/**
 * Type declarations for cart events
 */
export function emitCartChanged(): void;
export function onCartChanged(callback: () => void): () => void;

