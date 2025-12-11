-- ============================================================================
-- VERIFICATION SCRIPT: Background Manager Settings
-- ============================================================================
-- Run this script to verify that all background settings are properly configured
-- Copy and paste the output to check for any issues
-- ============================================================================

-- Step 1: Check if singleton row exists
DO $$
DECLARE
  row_count INTEGER;
  has_guard BOOLEAN;
BEGIN
  SELECT COUNT(*), bool_and(singleton_guard)
  INTO row_count, has_guard
  FROM public.store_settings;

  RAISE NOTICE '=== SINGLETON ROW CHECK ===';
  RAISE NOTICE 'Total rows in store_settings: %', row_count;
  RAISE NOTICE 'Has singleton_guard = true: %', COALESCE(has_guard, false);

  IF row_count = 0 THEN
    RAISE WARNING 'NO ROWS FOUND! Creating singleton row...';
    INSERT INTO public.store_settings (singleton_guard) VALUES (true);
    RAISE NOTICE 'Singleton row created successfully';
  ELSIF row_count > 1 THEN
    RAISE WARNING 'MULTIPLE ROWS FOUND! Only one row should exist with singleton_guard = true';
  ELSIF NOT COALESCE(has_guard, false) THEN
    RAISE WARNING 'Row exists but singleton_guard is not true! Fixing...';
    UPDATE public.store_settings SET singleton_guard = true WHERE singleton_guard IS NULL OR singleton_guard = false;
    RAISE NOTICE 'Fixed singleton_guard value';
  ELSE
    RAISE NOTICE 'Singleton row check: PASSED ✓';
  END IF;
END $$;

-- Step 2: Verify background columns exist
DO $$
DECLARE
  column_count INTEGER;
  missing_columns TEXT[];
  expected_columns TEXT[] := ARRAY[
    'hero_bg_type', 'hero_bg_color', 'hero_bg_gradient', 'hero_bg_image_url',
    'gallery_section_bg_type', 'gallery_section_bg_color', 'gallery_section_bg_gradient', 'gallery_section_bg_image_url',
    'page_bg_type', 'page_bg_color', 'page_bg_gradient', 'page_bg_image_url',
    'hero_quote_bg_type', 'hero_quote_bg_color', 'hero_quote_bg_gradient', 'hero_quote_bg_image_url'
  ];
  col TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== BACKGROUND COLUMNS CHECK ===';

  -- Count existing background columns
  SELECT COUNT(*)
  INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'store_settings'
  AND table_schema = 'public'
  AND column_name LIKE '%bg%';

  RAISE NOTICE 'Total background columns found: %', column_count;

  -- Find missing columns
  missing_columns := ARRAY[]::TEXT[];
  FOREACH col IN ARRAY expected_columns LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'store_settings'
      AND table_schema = 'public'
      AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE WARNING 'MISSING COLUMNS: %', array_to_string(missing_columns, ', ');
    RAISE WARNING 'Run migration 038_add_background_settings.sql to add missing columns';
  ELSE
    RAISE NOTICE 'All 16 expected background columns exist: PASSED ✓';
  END IF;
END $$;

-- Step 3: Show current background settings
DO $$
DECLARE
  settings_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CURRENT BACKGROUND SETTINGS ===';

  SELECT
    hero_bg_type, hero_bg_color,
    gallery_section_bg_type, gallery_section_bg_color,
    page_bg_type, page_bg_color,
    hero_quote_bg_type, hero_quote_bg_color
  INTO settings_record
  FROM public.store_settings
  WHERE singleton_guard = true;

  IF FOUND THEN
    RAISE NOTICE 'Hero: type=%, color=%', settings_record.hero_bg_type, settings_record.hero_bg_color;
    RAISE NOTICE 'Gallery Section: type=%, color=%', settings_record.gallery_section_bg_type, settings_record.gallery_section_bg_color;
    RAISE NOTICE 'Page: type=%, color=%', settings_record.page_bg_type, settings_record.page_bg_color;
    RAISE NOTICE 'Hero Quote: type=%, color=%', settings_record.hero_quote_bg_type, settings_record.hero_quote_bg_color;
  ELSE
    RAISE WARNING 'Could not retrieve settings - singleton row may not exist!';
  END IF;
END $$;

-- Step 4: Verify RLS policies on store_settings
DO $$
DECLARE
  select_policy_count INTEGER;
  update_policy_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RLS POLICIES CHECK ===';

  -- Check if RLS is enabled
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'store_settings'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'Row Level Security: ENABLED ✓';
  ELSE
    RAISE WARNING 'Row Level Security: DISABLED - May cause permission issues';
  END IF;

  -- Count SELECT policies
  SELECT COUNT(*)
  INTO select_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'store_settings'
  AND cmd = 'SELECT';

  -- Count UPDATE policies
  SELECT COUNT(*)
  INTO update_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'store_settings'
  AND cmd = 'UPDATE';

  RAISE NOTICE 'SELECT policies: %', select_policy_count;
  RAISE NOTICE 'UPDATE policies: %', update_policy_count;

  IF select_policy_count = 0 THEN
    RAISE WARNING 'No SELECT policies found - users may not be able to read settings';
  END IF;

  IF update_policy_count = 0 THEN
    RAISE WARNING 'No UPDATE policies found - admins may not be able to save settings';
  END IF;
END $$;

-- Step 5: Verify storage bucket exists
DO $$
DECLARE
  bucket_exists BOOLEAN;
  bucket_public BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STORAGE BUCKET CHECK ===';

  SELECT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'product-images'
  ) INTO bucket_exists;

  IF bucket_exists THEN
    RAISE NOTICE 'Bucket "product-images": EXISTS ✓';

    SELECT public INTO bucket_public
    FROM storage.buckets
    WHERE id = 'product-images';

    IF bucket_public THEN
      RAISE NOTICE 'Bucket is public: YES ✓';
    ELSE
      RAISE WARNING 'Bucket is public: NO - Image URLs may not work!';
    END IF;
  ELSE
    RAISE WARNING 'Bucket "product-images": NOT FOUND';
    RAISE WARNING 'Run migration 004_add_product_images.sql to create the bucket';
  END IF;
END $$;

-- Step 6: Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION COMPLETE ===';
  RAISE NOTICE 'Check the output above for any WARNINGS or errors';
  RAISE NOTICE 'If all checks show PASSED ✓, the background system is ready to use';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Navigate to Admin → Gallery in your app';
  RAISE NOTICE '2. Click "Manage Backgrounds" button';
  RAISE NOTICE '3. Test saving a background (try solid color first)';
  RAISE NOTICE '4. Check browser console for any errors';
  RAISE NOTICE '5. Verify changes appear on the frontend';
END $$;
