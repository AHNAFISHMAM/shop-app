/**
 * Hooks Index
 *
 * Centralized export for all custom hooks.
 */

// Form hooks
export { useForm } from './useForm'
export type { UseFormReturn, UseFormOptions, ValidationSchema, FieldValidator } from './useForm'

// Performance hooks
export { useDebounce } from './useDebounce'
export { useThrottle } from './useThrottle'

// Storage hooks
export { useLocalStorage } from './useLocalStorage'

// UI hooks
export { useMediaQuery } from './useMediaQuery'
export { useClickOutside } from './useClickOutside'
export { useToggle } from './useToggle'
export { useWindowSize } from './useWindowSize'
export type { WindowSize } from './useWindowSize'

// Utility hooks
export { usePrevious } from './usePrevious'
export { useAsync } from './useAsync'
export type { AsyncState } from './useAsync'

// Body scroll lock
export { useBodyScrollLock } from './useBodyScrollLock'

// Real-time hooks
export { useRealtimeChannel } from './useRealtimeChannel'
export type { UseRealtimeChannelOptions } from './useRealtimeChannel'

