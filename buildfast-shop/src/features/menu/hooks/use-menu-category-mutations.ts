/**
 * useMenuCategoryMutations Hook
 *
 * Custom hooks for menu category mutations (create, update, delete, reorder).
 * Uses React Query mutations with proper cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/lib/query-keys'
import { defaultMutationConfig } from '../../../shared/lib/query-config'
import { supabase } from '../../../lib/supabase'
import { logger } from '../../../utils/logger'
import type { Database } from '../../../lib/database.types'

type MenuCategory = Database['public']['Tables']['menu_categories']['Row']
type MenuCategoryInsert = Database['public']['Tables']['menu_categories']['Insert']
type MenuCategoryUpdate = Database['public']['Tables']['menu_categories']['Update']

/**
 * Create category mutation
 */
export function useCreateMenuCategory() {
  const queryClient = useQueryClient()

  return useMutation<MenuCategory, Error, MenuCategoryInsert>({
    ...defaultMutationConfig,
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('menu_categories')
        .insert([data])
        .select()
        .single()

      if (error) {
        logger.error('Error creating menu category:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.categories() })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories() })
    },
  })
}

/**
 * Update category mutation
 */
export function useUpdateMenuCategory() {
  const queryClient = useQueryClient()

  return useMutation<MenuCategory, Error, { id: string; data: MenuCategoryUpdate }>({
    ...defaultMutationConfig,
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('menu_categories')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error('Error updating menu category:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.categories() })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories() })
    },
  })
}

/**
 * Delete category mutation
 */
export function useDeleteMenuCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    ...defaultMutationConfig,
    mutationFn: async (id) => {
      const { error } = await supabase.from('menu_categories').delete().eq('id', id)

      if (error) {
        logger.error('Error deleting menu category:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.categories() })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories() })
    },
  })
}

/**
 * Reorder categories mutation
 */
export function useReorderMenuCategories() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; sort_order: number }[]>({
    ...defaultMutationConfig,
    mutationFn: async (updates) => {
      // Update all categories in a transaction-like manner
      const promises = updates.map(({ id, sort_order }) =>
        supabase
          .from('menu_categories')
          .update({ sort_order, updated_at: new Date().toISOString() })
          .eq('id', id)
      )

      const results = await Promise.all(promises)
      const errors = results.filter((r) => r.error)

      if (errors.length > 0) {
        logger.error('Error reordering menu categories:', errors)
        throw new Error('Failed to reorder categories')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menu.categories() })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories() })
    },
  })
}

