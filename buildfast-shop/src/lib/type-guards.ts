/**
 * Type Guards
 *
 * Runtime type checking functions for validating data structures.
 * Use these to ensure type safety when working with external data (APIs, localStorage, etc.).
 */

import type { Database } from './database.types'
import type { User } from '@supabase/supabase-js'

/**
 * Type guard for checking if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type guard for checking if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Type guard for checking if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Type guard for checking if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Type guard for checking if value is an array
 */
export function isArray<T>(value: unknown, guard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false
  if (guard) {
    return value.every(guard)
  }
  return true
}

/**
 * Type guard for checking if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0
}

/**
 * Type guard for checking if value is a valid email
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

/**
 * Type guard for checking if value is a valid UUID
 */
export function isUUID(value: unknown): value is string {
  if (!isString(value)) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Type guard for Supabase User
 */
export function isSupabaseUser(value: unknown): value is User {
  return (
    isObject(value) &&
    'id' in value &&
    isString(value.id) &&
    'email' in value &&
    (isString(value.email) || value.email === null)
  )
}

/**
 * Type guard for Profile (from database.types)
 * Note: profiles table may not exist in all database schemas
 */
export function isProfile(
  value: unknown
): value is { id: string; email: string | null; [key: string]: unknown } {
  if (!isObject(value)) return false

  return (
    'id' in value &&
    isUUID(value.id) &&
    'email' in value &&
    (isString(value.email) || value.email === null)
  )
}

/**
 * Type guard for MenuItem (from database.types)
 */
export function isMenuItem(
  value: unknown
): value is Database['public']['Tables']['menu_items']['Row'] {
  if (!isObject(value)) return false

  return (
    'id' in value &&
    isUUID(value.id) &&
    'name' in value &&
    isString(value.name) &&
    'price' in value &&
    isNumber(value.price)
  )
}

/**
 * Type guard for CartItem (from database.types)
 */
export function isCartItem(
  value: unknown
): value is Database['public']['Tables']['cart_items']['Row'] {
  if (!isObject(value)) return false

  return (
    'id' in value &&
    isString(value.id) &&
    'user_id' in value &&
    isUUID(value.user_id) &&
    'menu_item_id' in value &&
    isUUID(value.menu_item_id) &&
    'quantity' in value &&
    isNumber(value.quantity)
  )
}

/**
 * Type guard for Order (from database.types)
 */
export function isOrder(value: unknown): value is Database['public']['Tables']['orders']['Row'] {
  if (!isObject(value)) return false

  return (
    'id' in value &&
    isUUID(value.id) &&
    'user_id' in value &&
    isUUID(value.user_id) &&
    'status' in value &&
    isString(value.status) &&
    'order_total' in value &&
    isNumber(value.order_total)
  )
}

/**
 * Generic type guard for array of items
 *
 * @example
 * ```tsx
 * const items = [1, 2, 3]
 * if (isArrayOf(items, isNumber)) {
 *   // items is number[]
 * }
 * ```
 */
export function isArrayOf<T>(arr: unknown, guard: (item: unknown) => item is T): arr is T[] {
  return Array.isArray(arr) && arr.every(guard)
}

/**
 * Type guard for Error object
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Type guard for checking if value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  prop: K
): value is Record<K, unknown> {
  return isObject(value) && prop in value
}

/**
 * Type guard for checking if value has multiple properties
 */
export function hasProperties<K extends string>(
  value: unknown,
  ...props: K[]
): value is Record<K, unknown> {
  if (!isObject(value)) return false
  return props.every(prop => prop in value)
}

/**
 * Type guard for discriminated union
 *
 * @example
 * ```tsx
 * type Result = { status: 'success'; data: string } | { status: 'error'; error: string }
 * if (isDiscriminatedUnion(result, 'status', 'success')) {
 *   // result is { status: 'success'; data: string }
 * }
 * ```
 */
export function isDiscriminatedUnion<T extends Record<string, unknown>>(
  value: unknown,
  discriminator: keyof T,
  expectedValue: T[keyof T]
): value is T {
  if (!isObject(value)) return false
  const val = value as Record<string, unknown>
  return val[discriminator as string] === expectedValue
}
