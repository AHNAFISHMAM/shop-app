export interface CartItem {
  id: string
  quantity: number
  [key: string]: unknown
}

export interface UseCartManagementReturn {
  cartItems: CartItem[]
  addToCart: (item: unknown, quantity?: number) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  isLoading: boolean
}

export function useCartManagement(): UseCartManagementReturn
