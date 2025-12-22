/**
 * useReservationMutations Hook
 *
 * Custom hooks for reservation mutations (create).
 * Uses React Query mutations with proper cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { defaultMutationConfig } from '../../../shared/lib/query-config'
import {
  createReservation,
  type ReservationData,
  type ReservationResponse,
} from '../../../lib/reservationService'

/**
 * Create reservation mutation
 */
export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation<ReservationResponse, Error, ReservationData>({
    ...defaultMutationConfig,
    mutationFn: async (reservationData) => {
      return await createReservation(reservationData)
    },
    onSuccess: (data, variables) => {
      if (data.success && data.reservationId) {
        // Invalidate reservations list to refetch updated reservations
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations.list(variables.userId || null) })
      }
    },
  })
}

