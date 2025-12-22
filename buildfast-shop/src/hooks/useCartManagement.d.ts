/**
 * Type declarations for useCartManagement hook
 */
export interface CartItem {
  id: string;
  product_id?: string | null;
  menu_item_id?: string | null;
  quantity: number;
  variant_id?: string | null;
  combination_id?: string | null;
  [key: string]: any;
}

export interface UseCartManagementReturn {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (item: Partial<CartItem>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export function useCartManagement(user: { id: string } | null): UseCartManagementReturn;

