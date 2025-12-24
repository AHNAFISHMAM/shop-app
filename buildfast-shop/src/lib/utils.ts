/**
 * Utility function to merge classNames conditionally
 * Enhanced version that handles arrays, objects, and conditional classes
 * Compatible with clsx/tailwind-merge patterns
 */
export function cn(
  ...classes: (
    | string
    | undefined
    | null
    | boolean
    | Record<string, boolean>
    | (string | undefined | null | boolean)[]
  )[]
): string {
  return classes
    .filter(Boolean)
    .map(cls => {
      if (typeof cls === 'string') return cls
      if (Array.isArray(cls)) return cls.filter(Boolean).join(' ')
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ')
      }
      return ''
    })
    .filter(Boolean)
    .join(' ')
}
