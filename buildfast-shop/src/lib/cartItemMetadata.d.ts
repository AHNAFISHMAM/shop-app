/**
 * Type declarations for cart item metadata
 */
export interface CartItemNoteResult {
  success: boolean;
  error?: any;
}

export interface SavedForLaterItem {
  id: string;
  product_id?: string | null;
  menu_item_id?: string | null;
  quantity: number;
  [key: string]: any;
}

export function getCartItemNotes(): Record<string, string>;
export function saveCartItemNote(itemId: string, note: string): CartItemNoteResult;
export function getCartItemNote(itemId: string): string | null;
export function getSavedForLaterItems(): SavedForLaterItem[];
export function addToSavedForLater(item: SavedForLaterItem): CartItemNoteResult;
export function removeFromSavedForLater(itemId: string): CartItemNoteResult;
export function clearSavedForLater(): void;

