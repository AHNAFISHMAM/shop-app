export interface CartItemNote {
  [itemId: string]: string;
}

export interface SavedForLaterItem {
  id: string;
  [key: string]: unknown;
}

export function getCartItemNotes(): CartItemNote;
export function getCartItemNote(itemId: string): string | null;
export function saveCartItemNote(itemId: string, note: string): { success: boolean; error?: unknown };
export function removeCartItemNote(itemId: string): { success: boolean; error?: unknown };
export function getSavedForLaterItems(): SavedForLaterItem[];
export function saveItemForLater(item: SavedForLaterItem): { success: boolean; error?: unknown };
export function removeFromSavedForLater(itemId: string): { success: boolean; error?: unknown };
export function isItemSavedForLater(itemId: string): boolean;
export function getSelectedReward(): { id: string; label?: string; cost?: number; [key: string]: unknown } | null;
export function saveSelectedReward(reward: { id: string; label?: string; cost?: number; [key: string]: unknown } | null): { success: boolean; error?: unknown };
export function clearCartMetadata(): { success: boolean; error?: unknown };

