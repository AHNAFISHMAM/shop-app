# 🏪 MASTER STORE SETTINGS PROMPT
## Production-Grade Store Configuration and Settings Management

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing store settings management in production applications for the **Star Café** application. It covers database schema, React Context patterns, calculation utilities, theme management, admin operations, and real-time synchronization based on actual codebase implementations.

**Key Features:**
- Singleton settings table pattern
- React Context for global access
- Shipping and tax calculations
- Currency formatting and display
- Theme adjustments (contrast, brightness, saturation, etc.)
- Feature flags integration
- Real-time settings updates via Supabase Realtime
- Optimistic UI updates with rollback
- Data normalization and validation

**Applicable to:**
- Store configuration management (name, logo, contact info)
- Shipping and tax calculation
- Currency formatting and display
- Theme customization (contrast, brightness, saturation)
- Feature flag toggles
- Store hours and policies
- Social media links
- Background and ambience settings

---

## 🎯 CORE PRINCIPLES

### 1. **Singleton Pattern**
- One row with `singleton_guard = true`
- All settings stored in a single table
- Easy to query and update

### 2. **Data Normalization**
- Convert database types to TypeScript types
- Handle null/undefined gracefully
- Provide sensible defaults

### 3. **Performance**
- Long-lived cache (30+ minutes) for settings
- Memoized calculations
- Optimistic UI updates

### 4. **Real-time Sync**
- Supabase Realtime subscriptions
- Automatic cache invalidation
- Instant updates across clients

---

## 🏗️ ARCHITECTURE OVERVIEW

### Database Schema

**Store Settings Table (Singleton):**
- Single row with `singleton_guard = true`
- Contains all store configuration
- Includes feature flags, theme settings, shipping config
- Public read access, admin-only write access

**Key Settings Categories:**
- Basic Info (name, description, logo)
- Contact (email, phone, social links)
- Shipping & Tax (type, cost, threshold, rate)
- Currency (code, symbol, formatting)
- Theme (contrast, brightness, saturation, etc.)
- Feature Flags (enable_* booleans)
- Policies (return policy, store hours)

---

## 🔒 PHASE 1: DATABASE SCHEMA

### Step 1.1: Store Settings Table

```sql
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_guard BOOLEAN NOT NULL DEFAULT true UNIQUE,
  
  -- Basic Information
  store_name TEXT NOT NULL DEFAULT 'Star Café',
  store_description TEXT,
  store_logo_url TEXT,
  
  -- Contact Information
  contact_email TEXT,
  contact_phone TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  
  -- Shipping Configuration
  shipping_type TEXT NOT NULL DEFAULT 'free' 
    CHECK (shipping_type IN ('free', 'free_over_amount', 'flat')),
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  free_shipping_threshold NUMERIC(10,2),
  
  -- Tax Configuration
  tax_rate NUMERIC(5,4) DEFAULT 0.08, -- 8% default (stored as decimal, e.g., 0.08)
  
  -- Currency Configuration
  currency TEXT NOT NULL DEFAULT 'USD' 
    CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),
  
  -- Store Policies
  store_hours TEXT,
  return_policy TEXT,
  
  -- Feature Flags
  enable_loyalty_program BOOLEAN DEFAULT true,
  enable_reservations BOOLEAN DEFAULT true,
  enable_menu_filters BOOLEAN DEFAULT true,
  enable_product_customization BOOLEAN DEFAULT true,
  enable_order_tracking BOOLEAN DEFAULT true,
  enable_order_feedback BOOLEAN DEFAULT true,
  enable_marketing_optins BOOLEAN DEFAULT true,
  enable_quick_reorder BOOLEAN DEFAULT true,
  
  -- Theme Settings
  show_home_ambience_uploader BOOLEAN DEFAULT false,
  show_theme_toggle BOOLEAN DEFAULT true,
  show_public_reviews BOOLEAN DEFAULT true,
  show_home_testimonials BOOLEAN DEFAULT true,
  scroll_thumb_brightness NUMERIC(3,2) DEFAULT 0.5,
  
  -- Theme Adjustments
  theme_contrast NUMERIC(3,2) DEFAULT 1.0,
  theme_exposure NUMERIC(3,2) DEFAULT 0.0,
  theme_brilliance NUMERIC(3,2) DEFAULT 0.0,
  theme_highlights NUMERIC(3,2) DEFAULT 0.0,
  theme_shadows NUMERIC(3,2) DEFAULT 0.0,
  theme_brightness NUMERIC(3,2) DEFAULT 0.0,
  theme_black_point NUMERIC(3,2) DEFAULT 0.0,
  theme_saturation NUMERIC(3,2) DEFAULT 0.0,
  theme_vibrance NUMERIC(3,2) DEFAULT 0.0,
  theme_warmth NUMERIC(3,2) DEFAULT 0.0,
  theme_tint NUMERIC(3,2) DEFAULT 0.0,
  theme_sharpness NUMERIC(3,2) DEFAULT 0.0,
  theme_definition NUMERIC(3,2) DEFAULT 0.0,
  theme_vignette NUMERIC(3,2) DEFAULT 0.0,
  
  -- Metadata
  reviews_visibility_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure singleton pattern
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_settings_singleton 
  ON public.store_settings(singleton_guard) 
  WHERE singleton_guard = true;

-- Insert default row if none exists
INSERT INTO public.store_settings (singleton_guard)
SELECT true
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings WHERE singleton_guard = true);
```

### Step 1.2: RLS Policies

```sql
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for public display)
CREATE POLICY "Anyone can read store settings"
  ON public.store_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update store settings"
  ON public.store_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );
```

### Step 1.3: Enable Realtime

```sql
-- Enable Realtime on store_settings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

-- Set replica identity to full for UPDATE events
ALTER TABLE public.store_settings REPLICA IDENTITY FULL;
```

---

## 💻 PHASE 2: TYPE DEFINITIONS

### Step 2.1: Store Settings Interface

**File:** `src/contexts/StoreSettingsContext.tsx`

```typescript
/**
 * ShippingType type
 */
export type ShippingType = 'free' | 'free_over_amount' | 'flat';

/**
 * Currency type
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

/**
 * StoreSettings interface
 */
export interface StoreSettings {
  store_name: string;
  store_description: string;
  store_logo_url: string | null;
  tax_rate: number;
  shipping_type: ShippingType;
  shipping_cost: number;
  free_shipping_threshold: number | null;
  currency: Currency;
  store_hours: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  return_policy: string;
  show_home_ambience_uploader: boolean;
  show_theme_toggle: boolean;
  show_public_reviews: boolean;
  show_home_testimonials: boolean;
  reviews_visibility_updated_at: string | null;
  scroll_thumb_brightness: number;
  enable_loyalty_program: boolean;
  enable_reservations: boolean;
  enable_menu_filters: boolean;
  enable_product_customization: boolean;
  enable_order_tracking: boolean;
  enable_order_feedback: boolean;
  enable_marketing_optins: boolean;
  enable_quick_reorder: boolean;
  theme_contrast: number;
  theme_exposure: number;
  theme_brilliance: number;
  theme_highlights: number;
  theme_shadows: number;
  theme_brightness: number;
  theme_black_point: number;
  theme_saturation: number;
  theme_vibrance: number;
  theme_warmth: number;
  theme_tint: number;
  theme_sharpness: number;
  theme_definition: number;
  theme_vignette: number;
}

/**
 * UpdateSettingsResponse interface
 */
export interface UpdateSettingsResponse {
  success: boolean;
  data?: StoreSettings;
  error?: string;
}

/**
 * StoreSettingsContextValue interface
 */
export interface StoreSettingsContextValue {
  settings: StoreSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<StoreSettings>) => Promise<UpdateSettingsResponse>;
  refreshSettings: () => Promise<void>;
  calculateShipping: (cartTotal: number) => number;
  calculateTax: (subtotal: number) => number;
  getCurrencySymbol: () => string;
  formatPrice: (amount: number) => string;
}
```

---

## 🔄 PHASE 3: REACT CONTEXT IMPLEMENTATION

### Step 3.1: Store Settings Context (Real Implementation)

**File:** `src/contexts/StoreSettingsContext.tsx`

This is the actual implementation from the codebase:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { applyThemeAdjustments } from '../utils/themeColorUtils'
import { logger } from '../utils/logger'

const StoreSettingsContext = createContext<StoreSettingsContextValue | undefined>(undefined)

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

/**
 * Normalize raw settings data
 */
const normalizeSettings = (raw: Partial<StoreSettings> = {}): StoreSettings => {
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

export function StoreSettingsProvider({ children }: StoreSettingsProviderProps) {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch store settings
  const fetchSettings = async (): Promise<void> => {
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
        setSettings(normalizeSettings(data as Partial<StoreSettings>))
      }
    } catch (err) {
      logger.error('Error in fetchSettings:', err)
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  // Update store settings (admin only)
  const updateSettings = async (updates: Partial<StoreSettings>): Promise<UpdateSettingsResponse> => {
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
    // Note: tax_rate is stored as decimal (e.g., 0.08 for 8%), but in some implementations it's stored as percentage
    // This implementation assumes percentage (e.g., 8 for 8%)
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
      AUD: 'A$'
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
        (payload: { new: Partial<StoreSettings> }) => {
          logger.log('Store settings updated (real-time):', payload)
          setSettings(normalizeSettings(payload.new))
        }
      )
      .subscribe((status: string) => {
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

  const value: StoreSettingsContextValue = {
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

export const useStoreSettings = (): StoreSettingsContextValue => {
  const context = useContext(StoreSettingsContext)
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider')
  }
  return context
}
```

---

## 🎨 PHASE 4: USAGE PATTERNS

### Step 4.1: Using Settings in Components

**File:** `src/components/Footer.tsx`

```typescript
import { useStoreSettings } from '../contexts/StoreSettingsContext'

export function Footer() {
  const { settings, formatPrice } = useStoreSettings()

  return (
    <footer>
      <h3>{settings?.store_name || 'Star Café'}</h3>
      <p>{settings?.store_description}</p>
      
      {settings?.contact_email && (
        <a href={`mailto:${settings.contact_email}`}>
          {settings.contact_email}
        </a>
      )}
      
      {settings?.facebook_url && (
        <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
      )}
    </footer>
  )
}
```

### Step 4.2: Shipping Calculation

**File:** `src/pages/Checkout/utils/calculations.ts`

```typescript
/**
 * Checkout Calculation Utilities
 */

import { parsePrice } from '../../../lib/priceUtils'
import { SHIPPING_THRESHOLD, SHIPPING_FEE, DEFAULT_TAX_RATE } from '../constants'

export interface CartItem {
  id: string
  quantity: number
  price?: number | string
  price_at_purchase?: number | string
  resolvedProduct?: {
    price?: number | string
  } | null
  product?: {
    price?: number | string
  } | null
}

/**
 * Calculate subtotal (sum of all item prices * quantities)
 */
export function calculateSubtotal(cartItems: CartItem[]): number {
  return cartItems.reduce((sum, item) => {
    // Use resolved product, fallback to embedded product, or use cart item data
    const product = item.resolvedProduct || item.product || {
      price: item.price || item.price_at_purchase || 0
    }
    
    // Handle price - might be string or number, or use fallback from cart item
    const price = typeof product.price === 'number' 
      ? product.price 
      : parsePrice(product.price || item.price || item.price_at_purchase || '0')
    
    return sum + (price * item.quantity)
  }, 0)
}

/**
 * Calculate shipping fee
 */
export function calculateShipping(subtotal: number): number {
  return subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}

/**
 * Calculate tax
 */
export function calculateTax(subtotal: number): number {
  return subtotal * DEFAULT_TAX_RATE
}

/**
 * Calculate grand total (subtotal + shipping + tax - discount)
 */
export function calculateGrandTotal(
  subtotal: number,
  shipping: number,
  tax: number,
  discountAmount: number
): number {
  const total = subtotal + shipping + tax
  return Math.max(0, total - discountAmount) // Ensure total doesn't go negative
}
```

**Using Store Settings for Calculations:**

```typescript
// components/CheckoutSummary.tsx

import { useStoreSettings } from '../contexts/StoreSettingsContext'

export function CheckoutSummary({ cartTotal }: { cartTotal: number }) {
  const { calculateShipping, calculateTax, formatPrice } = useStoreSettings()

  const shipping = calculateShipping(cartTotal)
  const tax = calculateTax(cartTotal)
  const total = cartTotal + shipping + tax

  return (
    <div>
      <div>Subtotal: {formatPrice(cartTotal)}</div>
      <div>Shipping: {formatPrice(shipping)}</div>
      <div>Tax: {formatPrice(tax)}</div>
      <div>Total: {formatPrice(total)}</div>
    </div>
  )
}
```

### Step 4.3: Checkout Calculations Hook

**File:** `src/pages/Checkout/hooks/useCheckoutCalculations.ts`

```typescript
/**
 * useCheckoutCalculations Hook
 *
 * Calculates checkout totals (subtotal, shipping, tax, grand total, etc.)
 */

import { useMemo } from 'react'
import {
  calculateTotalItemsCount,
  calculateSubtotal,
  calculateShipping,
  calculateTax,
  calculateGrandTotal,
  getTaxRatePercent,
  type CartItem,
} from '../utils/calculations'
import { resolveLoyaltyState } from '../../../lib/loyaltyUtils'

interface UseCheckoutCalculationsOptions {
  cartItems: CartItem[]
  discountAmount: number
}

interface UseCheckoutCalculationsReturn {
  totalItemsCount: number
  subtotal: number
  shipping: number
  tax: number
  taxRatePercent: number
  grandTotal: number
  loyalty: ReturnType<typeof resolveLoyaltyState>
}

/**
 * Hook for calculating checkout totals
 */
export function useCheckoutCalculations({
  cartItems,
  discountAmount,
}: UseCheckoutCalculationsOptions): UseCheckoutCalculationsReturn {
  const totalItemsCount = useMemo(
    () => calculateTotalItemsCount(cartItems),
    [cartItems]
  )

  const subtotal = useMemo(
    () => calculateSubtotal(cartItems),
    [cartItems]
  )

  const shipping = useMemo(
    () => calculateShipping(subtotal),
    [subtotal]
  )

  const tax = useMemo(
    () => calculateTax(subtotal),
    [subtotal]
  )

  const taxRatePercent = getTaxRatePercent()

  const grandTotal = useMemo(
    () => calculateGrandTotal(subtotal, shipping, tax, discountAmount),
    [subtotal, shipping, tax, discountAmount]
  )

  const loyalty = useMemo(
    () => resolveLoyaltyState(grandTotal),
    [grandTotal]
  )

  return {
    totalItemsCount,
    subtotal,
    shipping,
    tax,
    taxRatePercent,
    grandTotal,
    loyalty,
  }
}
```

### Step 4.4: Cart Totals Component

**File:** `src/components/order/CartTotals.tsx`

```typescript
import { useMemo } from 'react';
import { getCurrencySymbol, formatPrice } from '../../lib/priceUtils';

/**
 * CartTotals component props
 */
interface CartTotalsProps {
  /** Subtotal amount */
  subtotal: number;
  /** Delivery fee amount */
  deliveryFee: number;
  /** Total amount */
  total: number;
  /** Currency code (default: 'BDT') */
  currency?: string;
  /** Discount amount (default: 0) */
  discount?: number;
  /** Whether to show trust badges (default: true) */
  showTrustBadges?: boolean;
}

/**
 * Enhanced Cart Totals Component
 *
 * Displays price breakdown with trust badges and promo code.
 * Shows subtotal, discount, delivery fee, and total with secure checkout indicators.
 */
const CartTotals = ({
  subtotal,
  deliveryFee,
  total,
  currency = 'BDT',
  discount = 0,
  showTrustBadges = true,
}: CartTotalsProps) => {
  // Memoize formatted values
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);
  const formattedSubtotal = useMemo(() => formatPrice(subtotal, 0), [subtotal]);
  const formattedDiscount = useMemo(() => formatPrice(discount, 0), [discount]);
  const formattedDeliveryFee = useMemo(() => formatPrice(deliveryFee, 0), [deliveryFee]);
  const formattedTotal = useMemo(() => formatPrice(total, 0), [total]);
  const isFreeDelivery = useMemo(() => deliveryFee === 0, [deliveryFee]);
  const hasDiscount = useMemo(() => discount > 0, [discount]);

  return (
    <section className="cart-totals" aria-labelledby="cart-totals-heading">
      <h2 id="cart-totals-heading" className="sr-only">Cart Totals</h2>
      {/* Price Breakdown */}
      <div className="cart-totals-breakdown" role="table" aria-label="Price breakdown">
        <div className="cart-totals-row" role="row">
          <span className="cart-totals-label" role="rowheader">Subtotal</span>
          <span className="cart-totals-value" role="cell" aria-label={`Subtotal: ${currencySymbol}${formattedSubtotal}`}>
            {currencySymbol}{formattedSubtotal}
          </span>
        </div>

        {hasDiscount && (
          <div className="cart-totals-row" role="row">
            <span className="cart-totals-discount" role="rowheader">Discount</span>
            <span className="cart-totals-discount" role="cell" aria-label={`Discount: -${currencySymbol}${formattedDiscount}`}>
              -{currencySymbol}{formattedDiscount}
            </span>
          </div>
        )}

        <div className="cart-totals-row" role="row">
          <span className="cart-totals-label" role="rowheader">Delivery</span>
          <span className="cart-totals-value" role="cell" aria-label={isFreeDelivery ? 'Free delivery' : `Delivery fee: ${currencySymbol}${formattedDeliveryFee}`}>
            {isFreeDelivery ? (
              <span className="cart-totals-delivery-free">FREE</span>
            ) : (
              `${currencySymbol}${formattedDeliveryFee}`
            )}
          </span>
        </div>

        <div className="cart-totals-total" role="row">
          <div className="cart-totals-total-row">
            <span className="cart-totals-total-label" role="rowheader">Total</span>
            <span className="cart-totals-total-value" role="cell" aria-label={`Total: ${currencySymbol}${formattedTotal}`}>
              {currencySymbol}{formattedTotal}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartTotals;
```

### Step 4.5: Feature Flag Checks

```typescript
// components/MenuPage.tsx

import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useMemo } from 'react'

export function MenuPage() {
  const { settings, loading } = useStoreSettings()

  // Use useMemo to prevent unnecessary recalculations
  const enableReservations = useMemo(
    () => loading ? false : (settings?.enable_reservations ?? true),
    [loading, settings?.enable_reservations]
  )

  const enableMenuFilters = useMemo(
    () => loading ? false : (settings?.enable_menu_filters ?? true),
    [loading, settings?.enable_menu_filters]
  )

  return (
    <div>
      {enableMenuFilters && <MenuFilters />}
      {enableReservations && <ReservationButton />}
    </div>
  )
}
```

### Step 4.6: Theme Application

**File:** `src/utils/themeColorUtils.ts` (conceptual - actual file may differ)

```typescript
import type { StoreSettings } from '../contexts/StoreSettingsContext'

export function applyThemeAdjustments(settings: StoreSettings | null) {
  if (!settings) return

  const root = document.documentElement

  // Apply theme adjustments as CSS variables
  root.style.setProperty('--theme-contrast', String(settings.theme_contrast))
  root.style.setProperty('--theme-exposure', String(settings.theme_exposure))
  root.style.setProperty('--theme-brightness', String(settings.theme_brightness))
  root.style.setProperty('--theme-saturation', String(settings.theme_saturation))
  root.style.setProperty('--theme-vibrance', String(settings.theme_vibrance))
  root.style.setProperty('--theme-warmth', String(settings.theme_warmth))
  root.style.setProperty('--theme-tint', String(settings.theme_tint))
  root.style.setProperty('--theme-sharpness', String(settings.theme_sharpness))
  root.style.setProperty('--theme-definition', String(settings.theme_definition))
  root.style.setProperty('--theme-vignette', String(settings.theme_vignette))
  // ... other theme properties
}

// Use in component
useEffect(() => {
  if (settings) {
    applyThemeAdjustments(settings)
  }
}, [settings])
```

---

## 📡 PHASE 5: REAL-TIME UPDATES

### Step 5.1: Real-time Settings Subscription

The `StoreSettingsContext` automatically handles real-time updates via Supabase Realtime subscriptions. When an admin updates settings, all connected clients receive the update immediately.

**Implementation in StoreSettingsContext:**
```typescript
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
    (payload: { new: Partial<StoreSettings> }) => {
      logger.log('Store settings updated (real-time):', payload)
      setSettings(normalizeSettings(payload.new))
    }
  )
  .subscribe((status: string) => {
    if (status === 'SUBSCRIBED') {
      logger.log('Real-time subscription active for store_settings')
    } else if (status === 'CHANNEL_ERROR') {
      logger.error('Real-time subscription error - check RLS policies and replication')
    } else if (status === 'TIMED_OUT') {
      logger.warn('Real-time subscription timed out - retrying...')
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
```

---

## ✅ STORE SETTINGS CHECKLIST

### Implementation Checklist

- [ ] **Database Schema**
  - [ ] Store settings table created with singleton pattern
  - [ ] All columns defined with appropriate types
  - [ ] Default values set for all fields
  - [ ] RLS policies configured (public read, admin-only update)
  - [ ] Realtime enabled on table

- [ ] **Type Definitions**
  - [ ] `StoreSettings` interface includes all fields
  - [ ] `ShippingType` and `Currency` types defined
  - [ ] `UpdateSettingsResponse` interface defined
  - [ ] `StoreSettingsContextValue` interface defined

- [ ] **Context Implementation**
  - [ ] `StoreSettingsProvider` component created
  - [ ] `useStoreSettings` hook available
  - [ ] Default values defined
  - [ ] Normalization functions implemented
  - [ ] Real-time subscription set up

- [ ] **Calculation Utilities**
  - [ ] `calculateShipping` function implemented
  - [ ] `calculateTax` function implemented
  - [ ] `getCurrencySymbol` function implemented
  - [ ] `formatPrice` function implemented
  - [ ] All calculations handle null/undefined gracefully

- [ ] **Theme Management**
  - [ ] `applyThemeAdjustments` function implemented
  - [ ] Theme changes applied as CSS variables
  - [ ] Theme updates trigger re-renders

- [ ] **Admin Operations**
  - [ ] `updateSettings` function implemented
  - [ ] Optimistic UI updates with rollback
  - [ ] Error handling implemented
  - [ ] Admin authentication enforced

- [ ] **Usage Patterns**
  - [ ] Components use `useStoreSettings` hook
  - [ ] Calculations use context methods
  - [ ] Feature flags checked via settings
  - [ ] Loading states handled gracefully

- [ ] **Testing**
  - [ ] Settings can be fetched and displayed
  - [ ] Calculations work correctly
  - [ ] Real-time updates work across clients
  - [ ] Admin updates work correctly
  - [ ] RLS policies prevent unauthorized updates

---

## 🎯 SUCCESS CRITERIA

### Completion Criteria

✅ **Database:**
- Store settings table exists with singleton pattern
- RLS policies enforce admin-only updates
- Realtime enabled on table
- Default values set correctly

✅ **Type Safety:**
- All settings defined in TypeScript interface
- Type-safe access via context
- No `any` types used

✅ **Performance:**
- Long-lived cache for settings
- Memoized calculations
- Optimistic UI updates

✅ **User Experience:**
- No UI flicker during loading
- Smooth transitions when settings change
- Real-time updates work correctly

✅ **Security:**
- RLS policies prevent unauthorized updates
- Admin authentication enforced
- No sensitive data in settings

✅ **Real-time:**
- Updates propagate immediately
- Cache invalidation works correctly
- No stale data issues

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

- **Hardcode shipping costs or tax rates** - Always read from database
- **Skip normalization of database values** - Handle null/undefined gracefully
- **Allow non-admins to update settings** - Use RLS to protect updates
- **Forget to invalidate cache on updates** - Update React Query cache on changes
- **Calculate prices client-side only** - Validate on server for security
- **Ignore loading states** - Handle loading to prevent flicker
- **Store sensitive credentials in settings** - Keep settings public-safe
- **Forget to clean up real-time subscriptions** - Always remove channels on unmount

### ✅ Do:

- **Read all values from database** - Never hardcode
- **Normalize and validate all inputs** - Handle edge cases
- **Enforce admin-only updates via RLS** - Security first
- **Invalidate React Query cache** - Keep data fresh
- **Validate calculations server-side** - Security and accuracy
- **Handle loading states gracefully** - Prevent flicker
- **Keep settings public-safe** - No secrets in settings
- **Clean up real-time subscriptions** - Prevent memory leaks

---

## 📚 REFERENCE

### Key Files

- **Store Settings Context:** `src/contexts/StoreSettingsContext.tsx`
- **Checkout Calculations:** `src/pages/Checkout/utils/calculations.ts`
- **Checkout Calculations Hook:** `src/pages/Checkout/hooks/useCheckoutCalculations.ts`
- **Cart Totals Component:** `src/components/order/CartTotals.tsx`
- **Price Utils:** `src/lib/priceUtils.js`
- **Theme Utils:** `src/utils/themeColorUtils.ts` (if exists)
- **Admin Settings:** `src/pages/admin/AdminSettings.jsx`

### Calculation Examples

**Shipping Calculation:**
- `free`: Always returns 0
- `free_over_amount`: Returns 0 if cart total >= threshold, otherwise returns shipping_cost
- `flat`: Always returns shipping_cost

**Tax Calculation:**
- Multiplies subtotal by tax_rate (as percentage, e.g., 8 for 8%)
- Returns 0 if tax_rate is not set

**Currency Formatting:**
- Supports USD ($), EUR (€), GBP (£), CAD (C$), AUD (A$)
- Formats with 2 decimal places
- Returns symbol + amount (e.g., "$25.99")

---

## 🔗 RELATED MASTER PROMPTS

- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** - Database schema and RLS patterns
- **🔄 [MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md](./MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md)** - React Query patterns
- **🚩 [MASTER_FEATURE_FLAGS_PROMPT.md](./MASTER_FEATURE_FLAGS_PROMPT.md)** - Feature flags patterns
- **📡 [MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md](./MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md)** - Real-time subscription patterns

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This prompt ensures all store settings operations follow production-ready patterns with proper caching, calculations, and real-time synchronization.**
