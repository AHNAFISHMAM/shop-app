/**
 * Theme Color Utilities
 * Handles dynamic color calculations for warmth and tint adjustments
 */

import { logger } from './logger'

// Color calculation cache
const colorCache = new Map()
const CACHE_SIZE_LIMIT = 100

/**
 * Generate cache key from parameters
 */
function getCacheKey(warmth, tint) {
  return `${warmth.toFixed(0)}_${tint.toFixed(0)}`
}

/**
 * Clear cache if it gets too large
 */
function manageCache() {
  if (colorCache.size > CACHE_SIZE_LIMIT) {
    // Clear oldest entries (simple FIFO)
    const entries = Array.from(colorCache.entries())
    const toRemove = entries.slice(0, CACHE_SIZE_LIMIT / 2)
    toRemove.forEach(([key]) => colorCache.delete(key))
  }
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB object to hex color
 */
function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map(x => {
      const hex = Math.round(x).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    })
    .join('')}`
}

/**
 * Interpolate between two colors
 */
function interpolateColor(color1, color2, factor) {
  return {
    r: color1.r + (color2.r - color1.r) * factor,
    g: color1.g + (color2.g - color1.g) * factor,
    b: color1.b + (color2.b - color1.b) * factor,
  }
}

/**
 * Calculate warm-tinted background color for light theme
 * @param {string} baseColor - Base hex color (e.g., '#F4F6F8')
 * @param {number} warmth - Warmth value (-100 to +100)
 * @param {number} tint - Tint value (-100 to +100)
 * @returns {string} Calculated hex color
 */
export function calculateWarmBackground(baseColor, warmth, tint) {
  // Check cache first
  const cacheKey = getCacheKey(warmth, tint)
  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey)
  }

  // Validate and clamp inputs
  const clampedWarmth = Math.max(-100, Math.min(100, warmth || 0))
  const clampedTint = Math.max(-100, Math.min(100, tint || 0))

  // Normalize warmth (-100 to +100) to (0 to 1)
  const warmthFactor = (clampedWarmth + 100) / 200

  // Base colors
  const baseNeutral = hexToRgb('#F4F6F8')
  const baseWarm = hexToRgb('#F5EDE0')

  if (!baseNeutral || !baseWarm) {
    logger.error('Failed to parse base colors')
    return '#F4F6F8' // Fallback
  }

  // Interpolate between neutral and warm based on warmth
  const warmColor = interpolateColor(baseNeutral, baseWarm, warmthFactor)

  // Apply tint (green to magenta)
  // Normalize tint (-100 to +100) to (0 to 1)
  const tintFactor = (clampedTint + 100) / 200

  // Determine tint direction and amount
  const tintMagenta = hexToRgb('#F5E6F0')
  const tintGreen = hexToRgb('#F0F5E8')

  if (!tintMagenta || !tintGreen) {
    logger.error('Failed to parse tint colors')
    return rgbToHex(warmColor)
  }

  // Interpolate tint: 0 = no tint, 0.5 = neutral, 1 = full tint
  // Negative tint = green, positive tint = magenta
  const tintColor = clampedTint >= 0 ? tintMagenta : tintGreen
  const tintAmount = Math.abs(tintFactor - 0.5) * 2 // 0 to 1

  const finalColor = interpolateColor(warmColor, tintColor, tintAmount)

  const result = rgbToHex(finalColor)

  // Validate result
  if (!result || !/^#[0-9A-F]{6}$/i.test(result)) {
    logger.error('Invalid color calculation result:', result)
    return '#F4F6F8' // Fallback
  }

  // Cache result
  manageCache()
  colorCache.set(cacheKey, result)

  return result
}

/**
 * Clear color cache (useful for testing or memory management)
 */
export function clearColorCache() {
  colorCache.clear()
}

/**
 * Check if browser supports CSS color-mix()
 */
export function supportsColorMix() {
  if (typeof CSS === 'undefined' || !CSS.supports) {
    return false
  }
  return CSS.supports('color', 'color-mix(in srgb, white, black)')
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') {
    return false
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  return mediaQuery.matches
}

/**
 * Get transition duration based on user preference
 * @param {number} normalDuration - Normal duration in ms
 * @returns {number} Adjusted duration
 */
export function getTransitionDuration(normalDuration) {
  return prefersReducedMotion() ? 0 : normalDuration
}

/**
 * Apply theme adjustments to CSS variables
 * @param {Object} settings - Theme adjustment settings
 */
export function applyThemeAdjustments(settings) {
  if (!settings || typeof settings !== 'object') {
    logger.error('Invalid settings object provided to applyThemeAdjustments')
    return
  }

  try {
    const root = document.documentElement

    if (!root) {
      logger.error('Document root element not found')
      return
    }

    // Set CSS variables with validation
    const setVariable = (name, value, fallback) => {
      try {
        const normalizedValue = value ?? fallback
        root.style.setProperty(name, normalizedValue)
      } catch (error) {
        logger.error(`Failed to set CSS variable ${name}:`, error)
      }
    }

    setVariable('--theme-warmth', settings.theme_warmth, 0)
    setVariable('--theme-tint', settings.theme_tint, 0)
    setVariable('--theme-brightness', settings.theme_brightness, 1)
    setVariable('--theme-contrast', settings.theme_contrast, 1)
    setVariable('--theme-saturation', settings.theme_saturation, 1)
    setVariable('--theme-exposure', settings.theme_exposure, 0)
    setVariable('--theme-sharpness', settings.theme_sharpness, 0)
    setVariable('--theme-vignette', settings.theme_vignette, 0)

    // Fallback for browsers without color-mix support
    if (!supportsColorMix()) {
      try {
        const warmBg = calculateWarmBackground(
          '#F4F6F8',
          settings.theme_warmth ?? 0,
          settings.theme_tint ?? 0
        )

        root.style.setProperty('--bg-default', warmBg)
        root.style.setProperty('--bg-main', warmBg)

        // Calculate RGB values for the warm background
        const rgb = hexToRgb(warmBg)
        if (rgb) {
          root.style.setProperty('--bg-default-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
          root.style.setProperty('--bg-main-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
        } else {
          logger.warn('Failed to calculate RGB values for warm background')
        }
      } catch (error) {
        logger.error('Error applying warm background fallback:', error)
        // Use default fallback
        root.style.setProperty('--bg-default', '#F4F6F8')
        root.style.setProperty('--bg-main', '#F4F6F8')
      }
    }
  } catch (error) {
    logger.error('Error in applyThemeAdjustments:', error)
  }
}

// Debounce utility for theme adjustments
let debounceTimer = null

/**
 * Debounced version of applyThemeAdjustments
 * @param {Object} settings - Theme adjustment settings
 * @param {number} delay - Delay in milliseconds (default: 16ms for ~60fps)
 */
export function applyThemeAdjustmentsDebounced(settings, delay = 16) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    applyThemeAdjustments(settings)
    debounceTimer = null
  }, delay)
}

/**
 * Cancel pending debounced theme adjustments
 */
export function cancelDebouncedThemeAdjustments() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}
