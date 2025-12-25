import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { applyThemeAdjustments } from '../utils/themeColorUtils'
import { logger } from '../utils/logger'

/**
 * ShippingType type
 */
export type ShippingType = 'free' | 'free_over_amount' | 'flat'

/**
 * Currency type
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'

/**
 * StoreSettings interface
 */
export interface StoreSettings {
  store_name: string
  store_description: string
  store_logo_url: string | null
  tax_rate: number
  shipping_type: ShippingType
  shipping_cost: number
  free_shipping_threshold: number | null
  currency: Currency
  store_hours: string | null
  contact_email: string | null
  contact_phone: string | null
  facebook_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  return_policy: string
  store_location: string | null
  show_home_ambience_uploader: boolean
  show_theme_toggle: boolean
  show_public_reviews: boolean
  show_home_testimonials: boolean
  reviews_visibility_updated_at: string | null
  scroll_thumb_brightness: number
  enable_loyalty_program: boolean
  enable_reservations: boolean
  enable_menu_filters: boolean
  enable_product_customization: boolean
  enable_order_tracking: boolean
  enable_order_feedback: boolean
  enable_marketing_optins: boolean
  enable_quick_reorder: boolean
  theme_contrast: number
  theme_exposure: number
  theme_brilliance: number
  theme_highlights: number
  theme_shadows: number
  theme_brightness: number
  theme_black_point: number
  theme_saturation: number
  theme_vibrance: number
  theme_warmth: number
  theme_tint: number
  theme_sharpness: number
  theme_definition: number
  theme_vignette: number
}

/**
 * UpdateSettingsResponse interface
 */
export interface UpdateSettingsResponse {
  success: boolean
  data?: StoreSettings
  error?: string
}

/**
 * StoreSettingsContextValue interface
 */
export interface StoreSettingsContextValue {
  settings: StoreSettings | null
  loading: boolean
  updateSettings: (updates: Partial<StoreSettings>) => Promise<UpdateSettingsResponse>
  refreshSettings: () => Promise<void>
  calculateShipping: (cartTotal: number) => number
  calculateTax: (subtotal: number) => number
  getCurrencySymbol: () => string
  formatPrice: (amount: number) => string
}

const StoreSettingsContext = createContext<StoreSettingsContextValue | undefined>(undefined)

/**
 * useStoreSettings hook
 *
 * @returns {StoreSettingsContextValue} Store settings context value
 * @throws {Error} If used outside StoreSettingsProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useStoreSettings = (): StoreSettingsContextValue => {
  const context = useContext(StoreSettingsContext)
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider')
  }
  return context
}

/**
 * Normalize boolean value from various formats
 */
const normalizeBoolean = (value: unknown, fallback = false): boolean => {
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

/**
 * Clamp brightness value between 0.05 and 1.0
 */
const clampBrightness = (value: unknown, fallback = 0.6): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(1, Math.max(0.05, Number(parsed.toFixed(2))))
}

/**
 * Get default store settings
 */
const getDefaultSettings = (): StoreSettings => ({
  store_name: 'Buildfast Shop',
  store_description: 'Your one-stop shop for everything you need',
  store_logo_url: null,
  tax_rate: 0.0,
  shipping_type: 'flat',
  shipping_cost: 5.0,
  free_shipping_threshold: null,
  currency: 'USD',
  store_hours: null,
  contact_email: null,
  contact_phone: null,
  facebook_url: null,
  twitter_url: null,
  instagram_url: null,
  return_policy:
    'We accept returns within 30 days of purchase. Items must be in original condition.',
  store_location: null,
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
  theme_contrast: 1.05, // Slightly more contrast
  theme_exposure: 0.0,
  theme_brilliance: 0.0,
  theme_highlights: 0.0,
  theme_shadows: 0.0,
  theme_brightness: 0.95, // Slightly dimmer
  theme_black_point: 0.0,
  theme_saturation: 1.0,
  theme_vibrance: 0.0,
  theme_warmth: 20, // Warm tone
  theme_tint: 0.0,
  theme_sharpness: 0.0,
  theme_definition: 0.0,
  theme_vignette: 0.0,
})

/**
 * Normalize raw settings data
 */
const normalizeSettings = (raw: Partial<StoreSettings> = {}): StoreSettings => {
  const defaults = getDefaultSettings()
  return {
    ...defaults,
    ...raw,
    show_home_ambience_uploader: normalizeBoolean(
      raw.show_home_ambience_uploader,
      defaults.show_home_ambience_uploader
    ),
    show_theme_toggle: normalizeBoolean(raw.show_theme_toggle, defaults.show_theme_toggle),
    show_public_reviews: normalizeBoolean(raw.show_public_reviews, defaults.show_public_reviews),
    show_home_testimonials: normalizeBoolean(
      raw.show_home_testimonials,
      defaults.show_home_testimonials
    ),
    scroll_thumb_brightness: clampBrightness(
      raw.scroll_thumb_brightness ?? defaults.scroll_thumb_brightness,
      defaults.scroll_thumb_brightness
    ),
    // Normalize feature flags
    enable_loyalty_program: normalizeBoolean(
      raw.enable_loyalty_program,
      defaults.enable_loyalty_program
    ),
    enable_reservations: normalizeBoolean(raw.enable_reservations, defaults.enable_reservations),
    enable_menu_filters: normalizeBoolean(raw.enable_menu_filters, defaults.enable_menu_filters),
    enable_product_customization: normalizeBoolean(
      raw.enable_product_customization,
      defaults.enable_product_customization
    ),
    enable_order_tracking: normalizeBoolean(
      raw.enable_order_tracking,
      defaults.enable_order_tracking
    ),
    enable_order_feedback: normalizeBoolean(
      raw.enable_order_feedback,
      defaults.enable_order_feedback
    ),
    enable_marketing_optins: normalizeBoolean(
      raw.enable_marketing_optins,
      defaults.enable_marketing_optins
    ),
    enable_quick_reorder: normalizeBoolean(raw.enable_quick_reorder, defaults.enable_quick_reorder),
  }
}

/**
 * StoreSettingsProviderProps interface
 */
export interface StoreSettingsProviderProps {
  children: ReactNode
}

/**
 * StoreSettingsProvider Component
 *
 * @param {StoreSettingsProviderProps} props - Component props
 */
export function StoreSettingsProvider({ children }: StoreSettingsProviderProps) {
  // Initialize with defaults immediately so app can render while fetching
  const [settings, setSettings] = useState<StoreSettings | null>(getDefaultSettings())
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch store settings with timeout protection
  const fetchSettings = async (): Promise<void> => {
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        logger.warn('Supabase not configured, using default settings')
        setSettings(getDefaultSettings())
        setLoading(false)
        return
      }

      // Fetch settings with timeout - if it hangs, we'll use defaults
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Settings fetch timeout after 5s')), 5000)
      )

      const fetchPromise = supabase
        .from('store_settings')
        .select('*')
        .eq('singleton_guard', true)
        .single()

      let result: { data: unknown; error: unknown }
      try {
        result = await Promise.race([fetchPromise, timeoutPromise])
      } catch (timeoutErr) {
        // Timeout occurred - query is hanging (likely table doesn't exist or RLS blocking)
        logger.warn('⚠️ Settings query timed out - this usually means:')
        logger.warn('   1. store_settings table does not exist (run migration 022_create_store_settings_table.sql)')
        logger.warn('   2. RLS policies are blocking access (check public read policy)')
        logger.warn('   3. Supabase project is paused or has connection issues')
        logger.warn('   → App will continue with default settings')
        setSettings(getDefaultSettings())
        setLoading(false)
        return
      }

      const { data, error } = result

      if (error) {
        logger.error('Error fetching store settings:', error)
        logger.error('Error code:', error.code)
        logger.error('Error message:', error.message)
        logger.error('Error details:', error.details)
        
        // Log specific error types for debugging
        if (error.code === 'PGRST116' || error.code === '42P01') {
          logger.error('⚠️ store_settings table not found. Please run migrations.')
        } else if (error.code === '42501') {
          logger.error('⚠️ Permission denied. Check RLS policies on store_settings table.')
        } else if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
          logger.error('⚠️ Request timed out. Check Supabase connection.')
        }
        
        // Use default settings if fetch fails
        setSettings(getDefaultSettings())
      } else {
        logger.log('✅ Store settings loaded successfully')
        setSettings(normalizeSettings(data as Partial<StoreSettings>))
      }
    } catch (err) {
      // Check if it was a timeout error
      if (err instanceof Error && err.message.includes('timeout')) {
        logger.error('⚠️ Settings fetch timed out after 5s. Check:')
        logger.error('  1. Is store_settings table created?')
        logger.error('  2. Are RLS policies allowing public read?')
        logger.error('  3. Is Supabase URL correct?')
        logger.error('  4. Check Network tab for failed requests')
      }
      
      logger.error('Error in fetchSettings:', err)
      if (err instanceof Error) {
        logger.error('Error type:', err.constructor.name)
        logger.error('Error message:', err.message)
      }
      // Always set default settings on any error to prevent white screen
      setSettings(getDefaultSettings())
    } finally {
      // Always set loading to false, even on timeout/error
      setLoading(false)
      logger.log('StoreSettingsContext: Loading complete')
    }
  }

  // Update store settings (admin only)
  const updateSettings = async (
    updates: Partial<StoreSettings>
  ): Promise<UpdateSettingsResponse> => {
    try {
      if (!settings) {
        throw new Error('Settings not loaded yet')
      }

      const preparedUpdates: Partial<StoreSettings> = { ...updates }
      if (preparedUpdates.scroll_thumb_brightness !== undefined) {
        preparedUpdates.scroll_thumb_brightness = clampBrightness(
          preparedUpdates.scroll_thumb_brightness,
          settings?.scroll_thumb_brightness ?? getDefaultSettings().scroll_thumb_brightness
        )
      }

      // Store previous state for rollback on error
      const previousSettings: StoreSettings = { ...settings }

      // Optimistically update local state for immediate UI feedback
      setSettings(prev => normalizeSettings({ ...(prev || {}), ...preparedUpdates }))

      const { data, error } = await supabase
        .from('store_settings')
        .update(preparedUpdates as never)
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
      const normalizedData = normalizeSettings(data as Partial<StoreSettings>)
      setSettings(normalizedData)

      logger.log('Settings updated successfully:', Object.keys(preparedUpdates))
      return { success: true, data: normalizedData }
    } catch (err) {
      const error = err as Error
      logger.error('Error updating store settings:', err)
      return { success: false, error: error.message }
    }
  }

  // Calculate shipping cost based on cart total
  const calculateShipping = (cartTotal: number): number => {
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
  const calculateTax = (subtotal: number): number => {
    if (!settings || !settings.tax_rate) return 0
    return (subtotal * settings.tax_rate) / 100
  }

  // Get currency symbol
  const getCurrencySymbol = (): string => {
    if (!settings) return '$'

    const symbols: Record<Currency, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
    }

    return symbols[settings.currency] || '$'
  }

  // Format price with currency
  const formatPrice = (amount: number): string => {
    const symbol = getCurrencySymbol()
    return `${symbol}${Number(amount).toFixed(2)}`
  }

  // Load settings on mount
  useEffect(() => {
    // Log initialization for debugging
    if (typeof window !== 'undefined') {
      console.log('🔧 StoreSettingsContext: Initializing...')
      console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing')
    }
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
          filter: 'singleton_guard=eq.true',
        },
        (payload: { new: Partial<StoreSettings> }) => {
          logger.log('Store settings updated (real-time):', payload)
          setSettings(normalizeSettings(payload.new))
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
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
      applyThemeAdjustments(settings as unknown as Record<string, unknown>)
    }
  }, [settings])

  const value: StoreSettingsContextValue = {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings,
    calculateShipping,
    calculateTax,
    getCurrencySymbol,
    formatPrice,
  }

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>
}
