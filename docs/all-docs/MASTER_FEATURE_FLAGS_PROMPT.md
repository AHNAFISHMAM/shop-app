# 🚩 MASTER FEATURE FLAGS PROMPT
## Production-Grade Feature Flag Implementation and Management

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing feature flags in production applications for the **Star Café** application. It covers database schema, React Query integration, conditional rendering, admin management, real-time updates, and advanced patterns based on actual codebase implementations.

**Key Features:**
- Database-driven feature flags stored in `store_settings` table
- React Query caching and invalidation
- Conditional component rendering
- Admin management interface with real-time updates
- Default values and fallbacks to prevent UI flicker
- Type-safe flag access via TypeScript interfaces
- Real-time flag updates via Supabase Realtime
- Utility functions for easy flag checking

**Applicable to:**
- Enable/disable features without code deployment
- Gradual feature rollouts
- A/B testing different features
- Emergency feature disabling
- User segment targeting
- Beta feature access
- Maintenance mode toggles

---

## 🎯 CORE PRINCIPLES

### 1. **Database-Driven Flags**
- All feature flags stored in `store_settings` table
- Singleton pattern (one row with `singleton_guard = true`)
- All flags default to `true` (opt-in approach)
- Flags can be toggled without code deployment

### 2. **Type Safety**
- Flags defined in TypeScript interfaces
- Type-safe access via hooks and utilities
- Compile-time checking for flag names

### 3. **Performance**
- Long-lived cache (30+ minutes) for settings
- Default values during loading to prevent flicker
- Memoized flag values to prevent unnecessary re-renders

### 4. **Security**
- RLS policies enforce admin-only updates
- Public read access for flag checks
- No sensitive data in flags

---

## 🏗️ ARCHITECTURE OVERVIEW

### Database Schema

**Store Settings Table (Singleton):**
- Feature flags stored as boolean columns in `store_settings` table
- Singleton pattern (one row with `singleton_guard = true`)
- All flags default to `true` (opt-in approach)

**Flag Naming Convention:**
- Prefix: `enable_` (e.g., `enable_reservations`)
- Boolean type
- Default: `true` (features enabled by default)

**Current Feature Flags:**
1. `enable_loyalty_program` - Star Rewards loyalty program
2. `enable_reservations` - Table reservation system
3. `enable_menu_filters` - Dietary and allergen filters
4. `enable_product_customization` - Add-ons and spice levels
5. `enable_order_tracking` - Live order tracking timeline
6. `enable_order_feedback` - Post-meal feedback forms
7. `enable_marketing_optins` - Email/SMS marketing preferences
8. `enable_quick_reorder` - Quick reorder functionality

---

## 🔒 PHASE 1: DATABASE SCHEMA

### Step 1.1: Feature Flags Migration

**File:** `supabase/migrations/076_add_feature_flags.sql`

```sql
-- ============================================================================
-- MIGRATION: Add Feature Flags to Store Settings
-- ============================================================================
-- Adds feature flags for controlling visibility of new features
-- All features enabled by default
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '⚙️ Adding feature flags to store_settings table...';
END $$;

-- Add feature flag columns to store_settings table
ALTER TABLE public.store_settings 
  ADD COLUMN IF NOT EXISTS enable_loyalty_program BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_reservations BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_menu_filters BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_product_customization BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_order_tracking BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_order_feedback BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_marketing_optins BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_quick_reorder BOOLEAN DEFAULT true;

-- Update existing rows to have default values (all enabled by default)
UPDATE public.store_settings
SET 
  enable_loyalty_program = COALESCE(enable_loyalty_program, true),
  enable_reservations = COALESCE(enable_reservations, true),
  enable_menu_filters = COALESCE(enable_menu_filters, true),
  enable_product_customization = COALESCE(enable_product_customization, true),
  enable_order_tracking = COALESCE(enable_order_tracking, true),
  enable_order_feedback = COALESCE(enable_order_feedback, true),
  enable_marketing_optins = COALESCE(enable_marketing_optins, true),
  enable_quick_reorder = COALESCE(enable_quick_reorder, true)
WHERE singleton_guard = true;

-- Add comments for documentation
COMMENT ON COLUMN public.store_settings.enable_loyalty_program IS 'Enable/disable Star Rewards loyalty program';
COMMENT ON COLUMN public.store_settings.enable_reservations IS 'Enable/disable table reservation system';
COMMENT ON COLUMN public.store_settings.enable_menu_filters IS 'Enable/disable dietary and allergen filters on menu';
COMMENT ON COLUMN public.store_settings.enable_product_customization IS 'Enable/disable product customization (add-ons, spice levels)';
COMMENT ON COLUMN public.store_settings.enable_order_tracking IS 'Enable/disable live order tracking timeline';
COMMENT ON COLUMN public.store_settings.enable_order_feedback IS 'Enable/disable post-meal feedback forms';
COMMENT ON COLUMN public.store_settings.enable_marketing_optins IS 'Enable/disable email/SMS marketing preferences';
COMMENT ON COLUMN public.store_settings.enable_quick_reorder IS 'Enable/disable quick reorder functionality';

DO $$
BEGIN
  RAISE NOTICE '✅ Feature flags added successfully!';
END $$;
```

### Step 1.2: RLS Policies

```sql
-- Anyone can read settings (needed for feature flag checks)
CREATE POLICY "Anyone can read store settings"
  ON public.store_settings FOR SELECT
  USING (true);

-- Only admins can update feature flags
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

---

## 💻 PHASE 2: TYPE DEFINITIONS

### Step 2.1: Store Settings Interface

**File:** `src/contexts/StoreSettingsContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { applyThemeAdjustments } from '../utils/themeColorUtils'
import { logger } from '../utils/logger'

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
  
  // Feature Flags
  enable_loyalty_program: boolean;
  enable_reservations: boolean;
  enable_menu_filters: boolean;
  enable_product_customization: boolean;
  enable_order_tracking: boolean;
  enable_order_feedback: boolean;
  enable_marketing_optins: boolean;
  enable_quick_reorder: boolean;
  
  // Theme adjustments
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
  
  // Theme adjustments - defaults
  theme_contrast: 1.05,
  theme_exposure: 0.0,
  theme_brilliance: 0.0,
  theme_highlights: 0.0,
  theme_shadows: 0.0,
  theme_brightness: 0.95,
  theme_black_point: 0.0,
  theme_saturation: 1.0,
  theme_vibrance: 0.0,
  theme_warmth: 20,
  theme_tint: 0.0,
  theme_sharpness: 0.0,
  theme_definition: 0.0,
  theme_vignette: 0.0
})

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
    enable_quick_reorder: normalizeBoolean(raw.enable_quick_reorder, defaults.enable_quick_reorder),
  }
}
```

---

## 🔄 PHASE 3: REACT QUERY INTEGRATION

### Step 3.1: Query Keys

**File:** `src/shared/lib/query-keys.ts`

```typescript
export const queryKeys = {
  settings: {
    all: ['settings'] as const,
    store: () => [...queryKeys.settings.all, 'store'] as const,
    featureFlags: () => [...queryKeys.settings.all, 'featureFlags'] as const,
  },
}
```

### Step 3.2: Store Settings Context

**File:** `src/contexts/StoreSettingsContext.tsx`

The `StoreSettingsContext` provides:
- `settings`: Current store settings including feature flags
- `loading`: Loading state
- `updateSettings`: Function to update settings (admin only)
- `refreshSettings`: Function to manually refresh settings

**Usage:**
```typescript
import { useStoreSettings } from '../contexts/StoreSettingsContext'

function MyComponent() {
  const { settings, loading } = useStoreSettings()
  
  if (loading) return <div>Loading...</div>
  
  const canReserve = settings?.enable_reservations ?? false
  
  return (
    <div>
      {canReserve && <ReservationButton />}
    </div>
  )
}
```

---

## 🎨 PHASE 4: CONDITIONAL RENDERING PATTERNS

### Step 4.1: Simple Conditional Rendering

**File:** `src/pages/MenuPage.tsx`

```typescript
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import MenuReservationDrawer from '../components/MenuReservationDrawer'

const MenuPage = () => {
  const { settings } = useStoreSettings()
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState(false)
  
  // Check feature flags
  const enableReservations = settings?.enable_reservations ?? false
  const enableMenuFilters = settings?.enable_menu_filters ?? false
  
  return (
    <div>
      {/* Conditional rendering based on feature flags */}
      {enableMenuFilters && <MenuFilters />}
      
      {/* Conditional component rendering */}
      {enableReservations && (
        <MenuReservationDrawer
          isOpen={reservationDrawerOpen}
          onClose={() => setReservationDrawerOpen(false)}
        />
      )}
      
      {/* Rest of menu */}
    </div>
  )
}
```

### Step 4.2: Using Feature Flag Utility

**File:** `src/lib/featureFlags.js`

```javascript
import { useStoreSettings } from '../contexts/StoreSettingsContext'

/**
 * Hook to check if a feature is enabled
 * @param {string} featureName - Name of the feature flag (without 'enable_' prefix)
 * @returns {boolean} - Whether the feature is enabled
 * 
 * @example
 * const enableLoyalty = useFeatureFlag('loyalty_program')
 */
export const useFeatureFlag = (featureName) => {
  const { settings } = useStoreSettings()
  
  if (!settings) return false
  
  const flagName = `enable_${featureName}`
  return settings[flagName] ?? false
}

/**
 * Get feature flag value directly from settings object
 * @param {object} settings - Store settings object
 * @param {string} featureName - Name of the feature flag (without 'enable_' prefix)
 * @returns {boolean} - Whether the feature is enabled
 * 
 * @example
 * const enableLoyalty = getFeatureFlag(settings, 'loyalty_program')
 */
export const getFeatureFlag = (settings, featureName) => {
  if (!settings) return false
  
  const flagName = `enable_${featureName}`
  return settings[flagName] ?? false
}
```

**Usage:**
```typescript
import { useFeatureFlag } from '../lib/featureFlags'

function MyComponent() {
  const enableReservations = useFeatureFlag('reservations')
  const enableLoyalty = useFeatureFlag('loyalty_program')
  
  return (
    <div>
      {enableReservations && <ReservationButton />}
      {enableLoyalty && <LoyaltyCard />}
    </div>
  )
}
```

### Step 4.3: Conditional Route Rendering

```typescript
// App.tsx

import { useStoreSettings } from './contexts/StoreSettingsContext'
import { Routes, Route } from 'react-router-dom'

export function App() {
  const { settings } = useStoreSettings()
  const enableReservations = settings?.enable_reservations ?? false

  return (
    <Routes>
      <Route path="/menu" element={<MenuPage />} />
      {enableReservations && (
        <Route path="/reservations" element={<ReservationsPage />} />
      )}
      {/* Other routes */}
    </Routes>
  )
}
```

### Step 4.4: Conditional Hook Usage

```typescript
// components/OrderTracking.tsx

import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useOrderTracking } from '../hooks/useOrderTracking'

export function OrderDetails({ orderId }: { orderId: string }) {
  const { settings } = useStoreSettings()
  const enableOrderTracking = settings?.enable_order_tracking ?? false
  
  // Only fetch tracking data if feature is enabled
  const { data: tracking } = useOrderTracking(orderId, {
    enabled: enableOrderTracking,
  })

  return (
    <div>
      {enableOrderTracking && tracking && (
        <OrderTrackingTimeline tracking={tracking} />
      )}
    </div>
  )
}
```

### Step 4.5: Conditional Feature Access

**File:** `src/components/QuickActionsBar.tsx`

```typescript
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { Link } from 'react-router-dom'

export function QuickActionsBar() {
  const { settings } = useStoreSettings()
  
  const enableReservations = settings?.enable_reservations ?? false
  const enableQuickReorder = settings?.enable_quick_reorder ?? false
  const enableLoyalty = settings?.enable_loyalty_program ?? false

  return (
    <div className="quick-actions">
      {enableReservations && (
        <Link to="/reservations">Make Reservation</Link>
      )}
      {enableQuickReorder && (
        <button onClick={handleQuickReorder}>Quick Reorder</button>
      )}
      {enableLoyalty && (
        <Link to="/rewards">View Rewards</Link>
      )}
    </div>
  )
}
```

### Step 4.6: Loading State Handling

```typescript
// components/FeatureGatedComponent.tsx

import { useStoreSettings } from '../contexts/StoreSettingsContext'

interface FeatureGatedComponentProps {
  feature: 'enable_loyalty_program' | 'enable_reservations' | 'enable_menu_filters' | 'enable_product_customization' | 'enable_order_tracking' | 'enable_order_feedback' | 'enable_marketing_optins' | 'enable_quick_reorder'
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGatedComponent({ 
  feature, 
  children, 
  fallback = null 
}: FeatureGatedComponentProps) {
  const { settings, loading } = useStoreSettings()

  // Show nothing while loading (prevents flicker)
  if (loading) {
    return null
  }

  // Show children if feature enabled, fallback otherwise
  const isEnabled = settings?.[feature] ?? false
  return isEnabled ? <>{children}</> : <>{fallback}</>
}

// Usage:
<FeatureGatedComponent feature="enable_reservations">
  <ReservationButton />
</FeatureGatedComponent>
```

---

## 🔄 PHASE 5: ADMIN MANAGEMENT

### Step 5.1: Admin Feature Flags Component

**File:** `src/pages/admin/AdminFeatureFlags.jsx`

This is the actual implementation from the codebase:

```javascript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger';
import { pageFade } from '../../components/animations/menuAnimations';
import { logger } from '../../utils/logger';

const createFeatureFlagStatus = () => ({
  enable_loyalty_program: { saving: false, message: '', type: 'idle' },
  enable_reservations: { saving: false, message: '', type: 'idle' },
  enable_menu_filters: { saving: false, message: '', type: 'idle' },
  enable_product_customization: { saving: false, message: '', type: 'idle' },
  enable_order_tracking: { saving: false, message: '', type: 'idle' },
  enable_order_feedback: { saving: false, message: '', type: 'idle' },
  enable_marketing_optins: { saving: false, message: '', type: 'idle' },
  enable_quick_reorder: { saving: false, message: '', type: 'idle' }
});

function AdminFeatureFlags() {
  const navigate = useNavigate();
  const containerRef = useViewportAnimationTrigger();
  const { settings, loading: contextLoading, updateSettings } = useStoreSettings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    enable_loyalty_program: true,
    enable_reservations: true,
    enable_menu_filters: true,
    enable_product_customization: true,
    enable_order_tracking: true,
    enable_order_feedback: true,
    enable_marketing_optins: true,
    enable_quick_reorder: true
  });
  const [featureFlagStatus, setFeatureFlagStatus] = useState(createFeatureFlagStatus);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      setVerifying(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Log in to access admin tools.');
          setIsAdmin(false);
          navigate('/login');
          return;
        }

        const { data, error: customerError } = await supabase
          .from('customers')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (customerError || !data?.is_admin) {
          setError('Access denied. Administrator role required.');
          setIsAdmin(false);
          navigate('/admin');
          return;
        }

        setIsAdmin(true);
        setError('');
      } catch (err) {
        logger.error(err);
        setError('Unable to verify admin permissions.');
        setIsAdmin(false);
        navigate('/admin');
      } finally {
        setVerifying(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Load settings into form when they're available
  useEffect(() => {
    if (settings) {
      setFormData({
        enable_loyalty_program: settings.enable_loyalty_program ?? true,
        enable_reservations: settings.enable_reservations ?? true,
        enable_menu_filters: settings.enable_menu_filters ?? true,
        enable_product_customization: settings.enable_product_customization ?? true,
        enable_order_tracking: settings.enable_order_tracking ?? true,
        enable_order_feedback: settings.enable_order_feedback ?? true,
        enable_marketing_optins: settings.enable_marketing_optins ?? true,
        enable_quick_reorder: settings.enable_quick_reorder ?? true
      });
      setFeatureFlagStatus(createFeatureFlagStatus());
    }
  }, [settings]);

  const handleFeatureFlagToggle = async (field) => {
    const nextValue = !formData[field]
    const previousValue = formData[field]

    setFormData(prev => ({
      ...prev,
      [field]: nextValue
    }))

    setFeatureFlagStatus(prev => ({
      ...prev,
      [field]: { saving: true, message: '', type: 'idle' }
    }))

    const result = await updateSettings({ [field]: nextValue })

    if (result.success) {
      setFeatureFlagStatus(prev => ({
        ...prev,
        [field]: {
          saving: false,
          message: nextValue ? 'Enabled' : 'Disabled',
          type: 'success'
        }
      }))

      setTimeout(() => {
        setFeatureFlagStatus(prev => ({
          ...prev,
          [field]: { saving: false, message: '', type: 'idle' }
        }))
      }, 2000)
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: previousValue
      }))
      setFeatureFlagStatus(prev => ({
        ...prev,
        [field]: {
          saving: false,
          message: result.error || 'Update failed',
          type: 'error'
        }
      }))
    }
  };

  if (verifying || contextLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-[0_25px_60px_-45px_rgba(248,113,113,0.6)]">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-main)]">Admin Access Required</h2>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <m.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)]"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        <header className="mb-12 flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-main)]">Feature Flags</h1>
            <p className="mt-2 text-sm sm:text-base text-muted">
              Control which features are visible to customers across your store
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/settings')}
            className="px-4 py-2 rounded-xl border border-theme text-muted hover:text-[var(--text-main)] hover:border-[var(--accent)] transition-all duration-200"
          >
            Back to Settings
          </button>
        </header>

        {/* Feature Flags Section */}
        <div className="bg-theme-elevated rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 md:p-10 border border-theme text-[var(--text-main)]">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-2">Feature Flags</h2>
          <p className="text-sm sm:text-base text-[var(--text-muted)] mb-6">Control which features are visible to customers</p>

          <div className="space-y-6">
            {/* Each feature flag with toggle */}
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div className="max-w-md">
                  <p className="text-sm font-medium text-[var(--text-main)] mb-1">
                    {key.replace('enable_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {getFeatureDescription(key)}
                  </p>
                  {featureFlagStatus[key].saving && (
                    <p className="mt-2 text-xs text-amber-300 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                      Updating…
                    </p>
                  )}
                  {!featureFlagStatus[key].saving && featureFlagStatus[key].message && (
                    <p className={`mt-2 text-xs ${
                      featureFlagStatus[key].type === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {featureFlagStatus[key].message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    aria-label={`Toggle ${key}`}
                    onClick={() => handleFeatureFlagToggle(key)}
                    disabled={featureFlagStatus[key].saving}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ${
                      value
                        ? 'bg-[#C59D5F] border-[#E5C990] shadow-[0_0_12px_rgba(197,157,95,0.45)]'
                        : 'bg-theme-elevated border-transparent'
                    } ${featureFlagStatus[key].saving ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-200 ${
                      value
                        ? 'translate-x-6 shadow-[0_4px_14px_rgba(197,157,95,0.35)]'
                        : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-[0.65rem] uppercase tracking-[0.25em] text-[var(--text-muted)]">
                    {value ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </m.main>
  );
}

export default AdminFeatureFlags;
```

**Key Features:**
- Admin authentication check
- Individual toggle for each flag
- Real-time status updates (saving, success, error)
- Optimistic UI updates
- Error handling with rollback
- Accessible toggle switches

---

## 📡 PHASE 6: REAL-TIME UPDATES

### Step 6.1: Real-time Feature Flag Updates

The `StoreSettingsContext` automatically handles real-time updates via Supabase Realtime subscriptions. When an admin updates a feature flag, all connected clients receive the update immediately.

**Implementation in StoreSettingsContext:**
```typescript
// Real-time subscription is handled automatically by the context
// When store_settings table is updated, the context refetches
```

**To enable Realtime on store_settings table:**
```sql
-- Enable Realtime on store_settings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

-- Set replica identity to full for UPDATE events
ALTER TABLE public.store_settings REPLICA IDENTITY FULL;
```

---

## ✅ FEATURE FLAG CHECKLIST

### Implementation Checklist

- [ ] **Database Schema**
  - [ ] Migration file created with all feature flag columns
  - [ ] All flags default to `true`
  - [ ] Column comments added for documentation
  - [ ] RLS policies configured (public read, admin-only update)

- [ ] **Type Definitions**
  - [ ] `StoreSettings` interface includes all feature flags
  - [ ] Default values defined for all flags
  - [ ] Boolean normalization function handles edge cases

- [ ] **Context/Hooks**
  - [ ] `StoreSettingsContext` provides settings and loading state
  - [ ] `useStoreSettings` hook available for components
  - [ ] `useFeatureFlag` utility hook available
  - [ ] Default values prevent UI flicker during loading

- [ ] **Conditional Rendering**
  - [ ] Components check flags before rendering
  - [ ] Loading states handled gracefully
  - [ ] No hardcoded flags in components
  - [ ] Feature-gated components use flags

- [ ] **Admin Management**
  - [ ] Admin component created for flag management
  - [ ] Admin authentication enforced
  - [ ] Individual toggles for each flag
  - [ ] Real-time status updates (saving, success, error)
  - [ ] Error handling with rollback

- [ ] **Real-time Updates**
  - [ ] Realtime enabled on `store_settings` table
  - [ ] Context subscribes to updates
  - [ ] Cache invalidation on updates

- [ ] **Testing**
  - [ ] Flags can be toggled in admin interface
  - [ ] Conditional rendering works correctly
  - [ ] Loading states don't cause flicker
  - [ ] Real-time updates work across clients
  - [ ] RLS policies prevent unauthorized updates

---

## 🎯 SUCCESS CRITERIA

### Completion Criteria

✅ **Database:**
- All feature flag columns exist in `store_settings` table
- RLS policies enforce admin-only updates
- Default values set correctly

✅ **Type Safety:**
- All flags defined in TypeScript interface
- Type-safe access via hooks
- No `any` types used

✅ **Performance:**
- Long-lived cache (30+ minutes) for settings
- Default values prevent flicker
- Memoized flag values prevent unnecessary re-renders

✅ **User Experience:**
- No UI flicker during loading
- Smooth transitions when flags change
- Clear visual feedback in admin interface

✅ **Security:**
- RLS policies prevent unauthorized updates
- Admin authentication enforced
- No sensitive data in flags

✅ **Real-time:**
- Updates propagate immediately
- Cache invalidation works correctly
- No stale data issues

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

- **Hardcode feature flags** - Always read from database/context
- **Skip loading state handling** - Handle loading to prevent UI flicker
- **Allow non-admins to update flags** - Use RLS to protect updates
- **Forget to invalidate cache** - Update React Query cache on changes
- **Use flags for user permissions** - Use separate auth/role system
- **Create too many flags** - Keep flags focused and meaningful
- **Ignore defaults** - Always provide sensible defaults
- **Forget to document flags** - Add comments explaining each flag's purpose

### ✅ Do:

- **Read flags from database/context** - Never hardcode
- **Handle loading states gracefully** - Prevent flicker
- **Enforce admin-only updates via RLS** - Security first
- **Invalidate React Query cache** - Keep data fresh
- **Use separate auth system for permissions** - Don't mix concerns
- **Document flag purpose and usage** - Help future developers
- **Use consistent naming** - `enable_` prefix for all flags
- **Provide default values** - Prevent undefined behavior

---

## 🎯 ADVANCED PATTERNS

### Pattern 1: User Segment Targeting

```typescript
// hooks/useFeatureFlagForUser.ts

export function useFeatureFlagForUser(
  flag: string,
  userId: string | null
) {
  const { settings } = useStoreSettings()
  
  // Check if flag is enabled globally
  const globalEnabled = settings?.[flag as keyof StoreSettings] ?? true
  
  // Check user-specific override (if implemented)
  const { data: userOverride } = useQuery({
    queryKey: ['user-feature-flags', userId],
    queryFn: () => getUserFeatureFlag(userId, flag),
    enabled: !!userId && globalEnabled,
  })
  
  return userOverride ?? globalEnabled
}
```

### Pattern 2: Gradual Rollout

```typescript
// hooks/useFeatureFlagRollout.ts

export function useFeatureFlagRollout(
  flag: string,
  rolloutPercentage: number
) {
  const { settings } = useStoreSettings()
  const { user } = useAuth()
  
  const globalEnabled = settings?.[flag as keyof StoreSettings] ?? false
  
  if (!globalEnabled) return false
  
  // Calculate if user should see feature based on rollout percentage
  const userHash = hashUserId(user?.id || 'anonymous')
  const shouldShow = (userHash % 100) < rolloutPercentage
  
  return shouldShow
}
```

### Pattern 3: A/B Testing

```typescript
// hooks/useFeatureFlagVariant.ts

export function useFeatureFlagVariant(
  flag: string,
  variants: string[]
) {
  const { settings } = useStoreSettings()
  const { user } = useAuth()
  
  const flagEnabled = settings?.[flag as keyof StoreSettings] ?? false
  
  if (!flagEnabled) return null
  
  // Assign variant based on user ID hash
  const userHash = hashUserId(user?.id || 'anonymous')
  const variantIndex = userHash % variants.length
  
  return variants[variantIndex]
}
```

---

## 📚 REFERENCE

### Key Files

- **Store Settings Context:** `src/contexts/StoreSettingsContext.tsx`
- **Feature Flags Utility:** `src/lib/featureFlags.js`
- **Admin Component:** `src/pages/admin/AdminFeatureFlags.jsx`
- **Migration:** `supabase/migrations/076_add_feature_flags.sql`
- **Query Keys:** `src/shared/lib/query-keys.ts`

### Feature Flag Locations

**enable_loyalty_program:**
- `src/pages/HomePage.jsx` - Loyalty banner section
- `src/pages/OrderHistory.jsx` - Loyalty card display
- `src/pages/AddressBook.tsx` - Loyalty snapshot
- `src/components/order/CartSidebar.tsx` - Loyalty rewards section
- `src/components/order/CartBottomSheet.tsx` - Loyalty rewards section
- `src/components/ProfileDropdown.jsx` - "Share Referral" menu item

**enable_reservations:**
- `src/components/Navbar.jsx` - "RESERVE" link (desktop and mobile)
- `src/components/Footer.jsx` - "Reservations" link
- `src/pages/ContactPage.tsx` - "Concierge Request" action
- `src/pages/ReservationsPage.tsx` - Redirects to home if disabled
- `src/pages/MenuPage.tsx` - MenuReservationDrawer
- `src/components/QuickActionsBar.tsx` - "Book Now" link

**enable_menu_filters:**
- `src/pages/MenuPage.tsx` - Menu filters component

**enable_product_customization:**
- Product detail pages - Add-ons and spice level options

**enable_order_tracking:**
- Order detail pages - Live tracking timeline

**enable_order_feedback:**
- Order completion pages - Feedback forms

**enable_marketing_optins:**
- Checkout and profile pages - Marketing preference checkboxes

**enable_quick_reorder:**
- Order history pages - Quick reorder buttons

---

## 🔗 RELATED MASTER PROMPTS

- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** - Database schema and RLS patterns
- **🔄 [MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md](./MASTER_DATA_FETCHING_REACT_QUERY_PROMPT.md)** - React Query patterns
- **📡 [MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md](./MASTER_REALTIME_SUBSCRIPTIONS_PROMPT.md)** - Real-time subscription patterns
- **🏪 [MASTER_STORE_SETTINGS_PROMPT.md](./MASTER_STORE_SETTINGS_PROMPT.md)** - Store settings management

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This prompt ensures all feature flag operations follow production-ready patterns with proper caching, real-time updates, and admin management.**
