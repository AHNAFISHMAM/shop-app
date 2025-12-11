import { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../lib/supabase'
import { applyThemeAdjustments } from '../utils/themeColorUtils'
import { logger } from '../utils/logger'

const StoreSettingsContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext)
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider')
  }
  return context
}

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on', 't'].includes(normalized)) return true
    if (['false', '0', 'no', 'off', '', 'f'].includes(normalized)) return false
  }
  if (value === null || value === undefined) return fallback
  return fallback
}

const clampBrightness = (value, fallback = 0.6) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(1, Math.max(0.05, Number(parsed.toFixed(2))))
}

const getDefaultSettings = () => ({
  store_name: 'Buildfast Shop',
  store_description: 'Your one-stop shop for everything you need',
  store_logo_url: null,
  tax_rate: 0.00,
  shipping_type: 'flat',
  shipping_cost: 5.00,
  free_shipping_threshold: null,
  currency: 'USD',
  store_hours: null,
  contact_email: null,
  contact_phone: null,
  facebook_url: null,
  twitter_url: null,
  instagram_url: null,
  return_policy: 'We accept returns within 30 days of purchase. Items must be in original condition.',
  show_home_ambience_uploader: false,
  show_theme_toggle: true,
  show_public_reviews: false,
  show_home_testimonials: true,
  reviews_visibility_updated_at: null,
  scroll_thumb_brightness: 0.6,
  // Feature flags - all enabled by default
  enable_loyalty_program: true,
  enable_reservations: true,
  enable_menu_filters: true,
  enable_product_customization: true,
  enable_order_tracking: true,
  enable_order_feedback: true,
  enable_marketing_optins: true,
  enable_quick_reorder: true,
  // Theme Adjustments - defaults (better for light theme)
  theme_contrast: 1.05,      // Slightly more contrast
  theme_exposure: 0.0,
  theme_brilliance: 0.0,
  theme_highlights: 0.0,
  theme_shadows: 0.0,
  theme_brightness: 0.95,    // Slightly dimmer
  theme_black_point: 0.0,
  theme_saturation: 1.0,
  theme_vibrance: 0.0,
  theme_warmth: 20,          // Warm tone
  theme_tint: 0.0,
  theme_sharpness: 0.0,
  theme_definition: 0.0,
  theme_vignette: 0.0
})

const normalizeSettings = (raw = {}) => {
  const defaults = getDefaultSettings()
  return {
    ...defaults,
    ...raw,
    show_home_ambience_uploader: normalizeBoolean(raw.show_home_ambience_uploader, defaults.show_home_ambience_uploader),
    show_theme_toggle: normalizeBoolean(raw.show_theme_toggle, defaults.show_theme_toggle),
    show_public_reviews: normalizeBoolean(raw.show_public_reviews, defaults.show_public_reviews),
    show_home_testimonials: normalizeBoolean(raw.show_home_testimonials, defaults.show_home_testimonials),
    scroll_thumb_brightness: clampBrightness(raw.scroll_thumb_brightness ?? defaults.scroll_thumb_brightness, defaults.scroll_thumb_brightness),
    // Normalize feature flags
    enable_loyalty_program: normalizeBoolean(raw.enable_loyalty_program, defaults.enable_loyalty_program),
    enable_reservations: normalizeBoolean(raw.enable_reservations, defaults.enable_reservations),
    enable_menu_filters: normalizeBoolean(raw.enable_menu_filters, defaults.enable_menu_filters),
    enable_product_customization: normalizeBoolean(raw.enable_product_customization, defaults.enable_product_customization),
    enable_order_tracking: normalizeBoolean(raw.enable_order_tracking, defaults.enable_order_tracking),
    enable_order_feedback: normalizeBoolean(raw.enable_order_feedback, defaults.enable_order_feedback),
    enable_marketing_optins: normalizeBoolean(raw.enable_marketing_optins, defaults.enable_marketing_optins),
    enable_quick_reorder: normalizeBoolean(raw.enable_quick_reorder, defaults.enable_quick_reorder)
  }
}

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch store settings
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('singleton_guard', true)
        .single()

      if (error) {
        logger.error('Error fetching store settings:', error)
        // Use default settings if fetch fails
        setSettings(getDefaultSettings())
      } else {
        setSettings(normalizeSettings(data))
      }
    } catch (err) {
      logger.error('Error in fetchSettings:', err)
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  // Update store settings (admin only)
  const updateSettings = async (updates) => {
    try {
      if (!settings) {
        throw new Error('Settings not loaded yet')
      }

      const preparedUpdates = { ...updates }
      if (preparedUpdates.scroll_thumb_brightness !== undefined) {
        preparedUpdates.scroll_thumb_brightness = clampBrightness(
          preparedUpdates.scroll_thumb_brightness,
          settings?.scroll_thumb_brightness ?? getDefaultSettings().scroll_thumb_brightness
        )
      }

      // Store previous state for rollback on error
      const previousSettings = { ...settings }

      // Optimistically update local state for immediate UI feedback
      setSettings(prev => normalizeSettings({ ...(prev || {}), ...preparedUpdates }))

      const { data, error } = await supabase
        .from('store_settings')
        .update(preparedUpdates)
        .eq('singleton_guard', true)
        .select()
        .single()

      if (error) {
        // Rollback on error - restore previous state
        logger.error('Failed to update settings, rolling back:', error)
        setSettings(normalizeSettings(previousSettings))
        throw error
      }

      // Ensure normalized data is set (real-time subscription will also update, but this ensures consistency)
      const normalizedData = normalizeSettings(data)
      setSettings(normalizedData)
      
      logger.log('Settings updated successfully:', Object.keys(preparedUpdates))
      return { success: true, data: normalizedData }
    } catch (err) {
      logger.error('Error updating store settings:', err)
      return { success: false, error: err.message }
    }
  }

  // Get default settings (fallback)
  // Calculate shipping cost based on cart total
  const calculateShipping = (cartTotal) => {
    if (!settings) return 0

    switch (settings.shipping_type) {
      case 'free':
        return 0
      case 'free_over_amount':
        if (settings.free_shipping_threshold && cartTotal >= settings.free_shipping_threshold) {
          return 0
        }
        return settings.shipping_cost || 0
      case 'flat':
      default:
        return settings.shipping_cost || 0
    }
  }

  // Calculate tax based on subtotal
  const calculateTax = (subtotal) => {
    if (!settings || !settings.tax_rate) return 0
    return (subtotal * settings.tax_rate) / 100
  }

  // Get currency symbol
  const getCurrencySymbol = () => {
    if (!settings) return '$'

    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$'
    }

    return symbols[settings.currency] || '$'
  }

  // Format price with currency
  const formatPrice = (amount) => {
    const symbol = getCurrencySymbol()
    return `${symbol}${Number(amount).toFixed(2)}`
  }

  // Load settings on mount
  useEffect(() => {
    fetchSettings()

    // Set up real-time subscription for settings changes
    const channel = supabase
      .channel('store-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store_settings',
          filter: 'singleton_guard=eq.true'
        },
        (payload) => {
          logger.log('Store settings updated (real-time):', payload)
          setSettings(normalizeSettings(payload.new))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.log('Real-time subscription active for store_settings')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Real-time subscription error - check RLS policies and replication')
        } else if (status === 'TIMED_OUT') {
          logger.warn('Real-time subscription timed out - retrying...')
          // Optionally retry subscription
          setTimeout(() => {
            channel.subscribe()
          }, 2000)
        } else if (status === 'CLOSED') {
          logger.log('Real-time subscription closed')
        }
      })

    // Cleanup subscription
    return () => {
      logger.log('Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [])

  // Apply theme adjustments as CSS variables when settings change
  useEffect(() => {
    if (settings) {
      applyThemeAdjustments(settings)
    }
  }, [settings])

  const value = {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings,
    calculateShipping,
    calculateTax,
    getCurrencySymbol,
    formatPrice
  }

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

StoreSettingsProvider.propTypes = {
  children: PropTypes.node.isRequired
}
