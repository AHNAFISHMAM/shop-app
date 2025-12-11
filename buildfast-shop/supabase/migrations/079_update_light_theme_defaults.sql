-- ============================================================================
-- MIGRATION: Update Light Theme Defaults
-- ============================================================================
-- This migration updates default theme adjustment values for better light theme
-- appearance based on industry best practices
-- ============================================================================

-- Update default values for light theme (only if using defaults)
-- These values reduce white appearance and improve visual comfort
UPDATE public.store_settings
SET 
  theme_brightness = 0.95,  -- Slightly dimmer (reduces glare)
  theme_contrast = 1.05,    -- Slightly more contrast (improves readability)
  theme_warmth = 20,        -- Warm tone (reduces white appearance)
  theme_saturation = 1.0    -- Normal saturation
WHERE 
  theme_contrast = 1.0      -- Only update if using defaults
  AND theme_brightness = 1.0
  AND theme_warmth = 0.0;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check updated values
SELECT 
  theme_brightness,
  theme_contrast,
  theme_warmth,
  theme_saturation
FROM public.store_settings
WHERE singleton_guard = true;

