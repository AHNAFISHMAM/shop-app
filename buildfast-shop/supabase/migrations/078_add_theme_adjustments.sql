-- ============================================================================
-- MIGRATION: Add Theme Adjustment Columns to Store Settings
-- ============================================================================
-- This migration adds advanced theme customization controls to store_settings
-- allowing admins to fine-tune visual appearance with professional adjustments
-- ============================================================================

-- Add theme adjustment columns to store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS theme_contrast DECIMAL(5, 2) DEFAULT 1.0 CHECK (theme_contrast >= 0 AND theme_contrast <= 2.0),
ADD COLUMN IF NOT EXISTS theme_exposure DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_exposure >= -2.0 AND theme_exposure <= 2.0),
ADD COLUMN IF NOT EXISTS theme_brilliance DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_brilliance >= -1.0 AND theme_brilliance <= 1.0),
ADD COLUMN IF NOT EXISTS theme_highlights DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_highlights >= -1.0 AND theme_highlights <= 1.0),
ADD COLUMN IF NOT EXISTS theme_shadows DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_shadows >= -1.0 AND theme_shadows <= 1.0),
ADD COLUMN IF NOT EXISTS theme_brightness DECIMAL(5, 2) DEFAULT 1.0 CHECK (theme_brightness >= 0 AND theme_brightness <= 2.0),
ADD COLUMN IF NOT EXISTS theme_black_point DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_black_point >= -1.0 AND theme_black_point <= 1.0),
ADD COLUMN IF NOT EXISTS theme_saturation DECIMAL(5, 2) DEFAULT 1.0 CHECK (theme_saturation >= 0 AND theme_saturation <= 2.0),
ADD COLUMN IF NOT EXISTS theme_vibrance DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_vibrance >= -1.0 AND theme_vibrance <= 1.0),
ADD COLUMN IF NOT EXISTS theme_warmth DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_warmth >= -100 AND theme_warmth <= 100),
ADD COLUMN IF NOT EXISTS theme_tint DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_tint >= -100 AND theme_tint <= 100),
ADD COLUMN IF NOT EXISTS theme_sharpness DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_sharpness >= 0 AND theme_sharpness <= 1.0),
ADD COLUMN IF NOT EXISTS theme_definition DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_definition >= -1.0 AND theme_definition <= 1.0),
ADD COLUMN IF NOT EXISTS theme_vignette DECIMAL(5, 2) DEFAULT 0.0 CHECK (theme_vignette >= 0 AND theme_vignette <= 1.0);

-- Update existing rows to have default values
UPDATE public.store_settings
SET 
  theme_contrast = 1.0,
  theme_exposure = 0.0,
  theme_brilliance = 0.0,
  theme_highlights = 0.0,
  theme_shadows = 0.0,
  theme_brightness = 1.0,
  theme_black_point = 0.0,
  theme_saturation = 1.0,
  theme_vibrance = 0.0,
  theme_warmth = 0.0,
  theme_tint = 0.0,
  theme_sharpness = 0.0,
  theme_definition = 0.0,
  theme_vignette = 0.0
WHERE theme_contrast IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration worked)
-- ============================================================================

-- Check that columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'store_settings'
AND column_name LIKE 'theme_%'
ORDER BY column_name;

