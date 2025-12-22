/**
 * Type declarations for guest session utilities
 */
export interface CartItem {
  id: string;
  product_id?: string | null;
  menu_item_id?: string | null;
  quantity: number;
  variant_id?: string | null;
  combination_id?: string | null;
}

export function getGuestSessionId(): string;
export function clearGuestSession(): void;
export function getGuestCart(): CartItem[];
export function addToGuestCart(item: CartItem): void;
export function updateGuestCartQuantity(itemId: string, quantity: number): void;
export function removeFromGuestCart(itemId: string): void;
export function clearGuestCart(): void;

