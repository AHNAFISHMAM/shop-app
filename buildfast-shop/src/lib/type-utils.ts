/**
 * Type Utilities
 *
 * Custom utility types and type helpers for common patterns.
 */

import type { Database } from './database.types'

/**
 * Extract table row type from database schema
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/**
 * Extract table insert type from database schema
 */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/**
 * Extract table update type from database schema
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Deep partial (makes all nested properties optional)
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

/**
 * Deep required (makes all nested properties required)
 */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>
    }
  : T

/**
 * Non-nullable type (removes null and undefined)
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Extract promise return type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T

/**
 * Function that returns a promise
 */
export type AsyncFunction<T = void> = () => Promise<T>

/**
 * Function that takes parameters and returns a promise
 */
export type AsyncFunctionWithParams<TParams extends unknown[] = [], TReturn = void> = (
  ...args: TParams
) => Promise<TReturn>

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
  success: boolean
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

/**
 * Extract keys of type T that have value type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T]

/**
 * Extract values of type T
 */
export type ValueOf<T> = T[keyof T]

/**
 * Make all properties readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Branded type for type-safe IDs
 */
export type Brand<T, B> = T & { __brand: B }

/**
 * Example: Branded user ID
 */
export type UserId = Brand<string, 'UserId'>

/**
 * Example: Branded product ID
 */
export type ProductId = Brand<string, 'ProductId'>

/**
 * Extract function parameters as tuple
 */
export type Parameters<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: infer P
) => unknown
  ? P
  : never

/**
 * Extract function return type
 */
export type ReturnType<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: unknown[]
) => infer R
  ? R
  : never

/**
 * Common database table types
 * Note: profiles table may not exist in all database schemas
 */
export type Profile = {
  id: string
  email: string | null
  [key: string]: unknown
}
export type ProfileInsert = Partial<Profile>
export type ProfileUpdate = Partial<Profile>

export type MenuItem = TableRow<'menu_items'>
export type MenuItemInsert = TableInsert<'menu_items'>
export type MenuItemUpdate = TableUpdate<'menu_items'>

export type CartItem = TableRow<'cart_items'>
export type CartItemInsert = TableInsert<'cart_items'>
export type CartItemUpdate = TableUpdate<'cart_items'>

export type Order = TableRow<'orders'>
export type OrderInsert = TableInsert<'orders'>
export type OrderUpdate = TableUpdate<'orders'>

export type Reservation = TableRow<'table_reservations'>
export type ReservationInsert = TableInsert<'table_reservations'>
export type ReservationUpdate = TableUpdate<'table_reservations'>
