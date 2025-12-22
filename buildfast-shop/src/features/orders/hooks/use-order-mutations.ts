/**
 * useOrderMutations Hook
 *
 * Custom hooks for order mutations (create).
 * Uses React Query mutations with proper cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { defaultMutationConfig } from '../../../shared/lib/query-config'
import { createOrder, type OrderData, type OrderResponse } from '../../../lib/orderService'

/**
 * Create order mutation
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation<OrderResponse, Error, OrderData>({
    ...defaultMutationConfig,
    mutationFn: async (orderData) => {
      return await createOrder(orderData)
    },
    onSuccess: (data, variables) => {
      if (data.success && data.orderId) {
        // Invalidate orders list to refetch updated orders
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.history(variables.userId) })
        // Invalidate cart since order was created from cart
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(variables.userId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.summary(variables.userId) })
      }
    },
  })
}

