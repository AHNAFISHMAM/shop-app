-- ============================================================================
-- HOTFIX: Add Missing hero_quote_bg_image_url Column
-- ============================================================================
-- This adds the missing column that was accidentally omitted from migration 038
-- Run this in Supabase SQL Editor if you get:
-- "Could not find the 'hero_quote_bg_image_url' column"
-- ============================================================================

-- Add the missing column
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hero_quote_bg_image_url TEXT;

-- Add documentation comment
COMMENT ON COLUMN public.store_settings.hero_quote_bg_image_url IS 'Image URL for hero quote section background';

-- Verify the column was added
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'store_settings'
    AND column_name = 'hero_quote_bg_image_url'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE 'SUCCESS: hero_quote_bg_image_url column added ✓';
  ELSE
    RAISE EXCEPTION 'FAILED: Column was not added';
  END IF;
END $$;
