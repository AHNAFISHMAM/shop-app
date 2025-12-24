/**
 * Supabase Type Helpers
 *
 * Utility functions for type-safe Supabase operations.
 * Reduces boilerplate and improves type safety.
 */

import type { Database, Updates } from './database.types'

/**
 * Type-safe helper for Supabase update operations
 *
 * @example
 * ```typescript
 * await supabase
 *   .from('menu_items')
 *   .update(asUpdate('menu_items', { is_available: true }))
 *   .eq('id', itemId)
 * ```
 */
export function asUpdate<T extends keyof Database['public']['Tables']>(
  _table: T,
  data: Partial<Database['public']['Tables'][T]['Row']>
): Updates<T> {
  return data as Updates<T>
}

/**
 * Type-safe helper for Supabase insert operations
 *
 * @example
 * ```typescript
 * await supabase
 *   .from('menu_items')
 *   .insert(asInsert('menu_items', { name: 'Pizza', price: 10 }))
 * ```
 */
export function asInsert<T extends keyof Database['public']['Tables']>(
  _table: T,
  data: Database['public']['Tables'][T]['Insert']
): Database['public']['Tables'][T]['Insert'] {
  return data
}
