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

-- ============================================================================
-- VERIFICATION QUERY (Run this to verify the migration worked)
-- ============================================================================
-- SELECT 
--   enable_loyalty_program,
--   enable_reservations,
--   enable_menu_filters,
--   enable_product_customization,
--   enable_order_tracking,
--   enable_order_feedback,
--   enable_marketing_optins,
--   enable_quick_reorder
-- FROM public.store_settings;

