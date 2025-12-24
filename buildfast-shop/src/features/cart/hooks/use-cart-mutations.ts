/**
 * useCartMutations Hook
 *
 * Custom hooks for cart mutations (add, update, remove).
 * Uses React Query mutations with optimistic updates and proper cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { defaultMutationConfig } from '../../../shared/lib/query-config'
import {
  addMenuItemToCart,
  updateMenuItemQuantity,
  removeMenuItemFromCart,
  type CartOperationResult,
} from '../../../lib/cartUtils'
import type { MenuItem, CartItem } from '../../../lib/database.types'
import type { User as _User } from '@supabase/supabase-js'

/**
 * Cart item with resolved product data
 */
type CartItemWithProduct = CartItem & {
  menu_items?: MenuItem | null
  dishes?: unknown | null
  products?: unknown | null
  resolvedProduct?: MenuItem | null
  resolvedProductType?: string | null
}

/**
 * Add menu item to cart mutation
 */
interface AddToCartVariables {
  menuItem: MenuItem
  userId: string
}

interface AddToCartContext {
  previousCartItems: CartItemWithProduct[] | undefined
  previousCartCount: number | undefined
}

export function useAddMenuItemToCart() {
  const queryClient = useQueryClient()

  return useMutation<CartOperationResult, Error, AddToCartVariables, AddToCartContext>({
    ...defaultMutationConfig,
    mutationFn: async ({ menuItem, userId }) => {
      return await addMenuItemToCart(menuItem, userId)
    },
    onMutate: async ({ menuItem, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items(userId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.summary(userId) })

      // Snapshot previous values
      const previousCartItems = queryClient.getQueryData<CartItemWithProduct[]>(
        queryKeys.cart.items(userId)
      )
      const previousCartCount = queryClient.getQueryData<number>(queryKeys.cart.summary(userId))

      // Optimistically update cart items
      if (previousCartItems) {
        const existingItem = previousCartItems.find(item => item.menu_item_id === menuItem.id)
        if (existingItem) {
          // Update quantity if item exists
          const updatedItems = previousCartItems.map(item =>
            item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
          )
          queryClient.setQueryData(queryKeys.cart.items(userId), updatedItems)
        } else {
          // Add new item
          const newItem: CartItemWithProduct = {
            id: `temp-${Date.now()}`,
            user_id: userId,
            menu_item_id: menuItem.id,
            product_id: null,
            quantity: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            resolvedProduct: menuItem,
            resolvedProductType: 'menu_item',
            menu_items: menuItem,
          }
          queryClient.setQueryData(queryKeys.cart.items(userId), [...previousCartItems, newItem])
        }
      }

      // Optimistically update cart count
      if (previousCartCount !== undefined) {
        queryClient.setQueryData(queryKeys.cart.summary(userId), previousCartCount + 1)
      }

      return { previousCartItems, previousCartCount }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousCartItems !== undefined) {
        queryClient.setQueryData(queryKeys.cart.items(variables.userId), context.previousCartItems)
      }
      if (context?.previousCartCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.cart.summary(variables.userId),
          context.previousCartCount
        )
      }
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        // Invalidate to refetch and ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary(variables.userId) })
      }
    },
  })
}

/**
 * Update cart item quantity mutation
 */
interface UpdateQuantityVariables {
  cartItemId: string
  newQuantity: number
  userId: string
}

interface UpdateQuantityContext {
  previousCartItems: CartItemWithProduct[] | undefined
  previousCartCount: number | undefined
  quantityDiff: number
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation<
    { error: Error | null },
    Error,
    UpdateQuantityVariables,
    UpdateQuantityContext
  >({
    ...defaultMutationConfig,
    mutationFn: async ({ cartItemId, newQuantity, userId }) => {
      return await updateMenuItemQuantity(cartItemId, newQuantity, userId)
    },
    onMutate: async ({ cartItemId, newQuantity, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items(userId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.summary(userId) })

      // Snapshot previous values
      const previousCartItems = queryClient.getQueryData<CartItemWithProduct[]>(
        queryKeys.cart.items(userId)
      )
      const previousCartCount = queryClient.getQueryData<number>(queryKeys.cart.summary(userId))

      // Find the item being updated
      const itemToUpdate = previousCartItems?.find(item => item.id === cartItemId)
      const oldQuantity = itemToUpdate?.quantity || 0
      const quantityDiff = newQuantity - oldQuantity

      // Optimistically update cart items
      if (previousCartItems && itemToUpdate) {
        const updatedItems = previousCartItems.map(item =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
        queryClient.setQueryData(queryKeys.cart.items(userId), updatedItems)
      }

      // Optimistically update cart count
      if (previousCartCount !== undefined) {
        queryClient.setQueryData(queryKeys.cart.summary(userId), previousCartCount + quantityDiff)
      }

      return { previousCartItems, previousCartCount, quantityDiff }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousCartItems !== undefined) {
        queryClient.setQueryData(queryKeys.cart.items(variables.userId), context.previousCartItems)
      }
      if (context?.previousCartCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.cart.summary(variables.userId),
          context.previousCartCount
        )
      }
    },
    onSuccess: (data, variables) => {
      if (!data.error) {
        // Invalidate to refetch and ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary(variables.userId) })
      }
    },
  })
}

/**
 * Remove cart item mutation
 */
interface RemoveCartItemVariables {
  cartItemId: string
  userId: string
}

interface RemoveCartItemContext {
  previousCartItems: CartItemWithProduct[] | undefined
  previousCartCount: number | undefined
  removedQuantity: number
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation<
    { error: Error | null },
    Error,
    RemoveCartItemVariables,
    RemoveCartItemContext
  >({
    ...defaultMutationConfig,
    mutationFn: async ({ cartItemId, userId }) => {
      return await removeMenuItemFromCart(cartItemId, userId)
    },
    onMutate: async ({ cartItemId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items(userId) })
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.summary(userId) })

      // Snapshot previous values
      const previousCartItems = queryClient.getQueryData<CartItemWithProduct[]>(
        queryKeys.cart.items(userId)
      )
      const previousCartCount = queryClient.getQueryData<number>(queryKeys.cart.summary(userId))

      // Find the item being removed
      const itemToRemove = previousCartItems?.find(item => item.id === cartItemId)
      const removedQuantity = itemToRemove?.quantity || 0

      // Optimistically remove item from cart
      if (previousCartItems) {
        const updatedItems = previousCartItems.filter(item => item.id !== cartItemId)
        queryClient.setQueryData(queryKeys.cart.items(userId), updatedItems)
      }

      // Optimistically update cart count
      if (previousCartCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.cart.summary(userId),
          previousCartCount - removedQuantity
        )
      }

      return { previousCartItems, previousCartCount, removedQuantity }
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousCartItems !== undefined) {
        queryClient.setQueryData(queryKeys.cart.items(variables.userId), context.previousCartItems)
      }
      if (context?.previousCartCount !== undefined) {
        queryClient.setQueryData(
          queryKeys.cart.summary(variables.userId),
          context.previousCartCount
        )
      }
    },
    onSuccess: (data, variables) => {
      if (!data.error) {
        // Invalidate to refetch and ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary(variables.userId) })
      }
    },
  })
}
