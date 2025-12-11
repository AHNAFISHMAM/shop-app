-- ============================================================================
-- MIGRATION: Add Background Manager Settings
-- ============================================================================
-- Extends store_settings table with comprehensive background customization
-- Allows admins to control backgrounds for Hero, Gallery Section, Page, Hero Quote
-- Supports: Solid Colors, Gradients, Images, and Presets
-- ============================================================================

-- Step 1: Add background columns for Hero Section
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hero_bg_type TEXT DEFAULT 'solid' CHECK (hero_bg_type IN ('solid', 'gradient', 'image', 'none')),
ADD COLUMN IF NOT EXISTS hero_bg_color TEXT DEFAULT '#050509',
ADD COLUMN IF NOT EXISTS hero_bg_gradient TEXT,
ADD COLUMN IF NOT EXISTS hero_bg_image_url TEXT;

-- Step 2: Add background columns for Gallery Section
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS gallery_section_bg_type TEXT DEFAULT 'solid' CHECK (gallery_section_bg_type IN ('solid', 'gradient', 'image', 'none')),
ADD COLUMN IF NOT EXISTS gallery_section_bg_color TEXT DEFAULT '#050509',
ADD COLUMN IF NOT EXISTS gallery_section_bg_gradient TEXT,
ADD COLUMN IF NOT EXISTS gallery_section_bg_image_url TEXT;

-- Step 3: Add background columns for Page Background
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS page_bg_type TEXT DEFAULT 'solid' CHECK (page_bg_type IN ('solid', 'gradient', 'image', 'none')),
ADD COLUMN IF NOT EXISTS page_bg_color TEXT DEFAULT '#050509',
ADD COLUMN IF NOT EXISTS page_bg_gradient TEXT,
ADD COLUMN IF NOT EXISTS page_bg_image_url TEXT;

-- Step 4: Extend Hero Quote Section
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hero_quote_bg_type TEXT DEFAULT 'image' CHECK (hero_quote_bg_type IN ('solid', 'gradient', 'image', 'none')),
ADD COLUMN IF NOT EXISTS hero_quote_bg_color TEXT,
ADD COLUMN IF NOT EXISTS hero_quote_bg_gradient TEXT,
ADD COLUMN IF NOT EXISTS hero_quote_bg_image_url TEXT;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.store_settings.hero_bg_type IS 'Background type for hero section: solid, gradient, image, or none';
COMMENT ON COLUMN public.store_settings.hero_bg_color IS 'Solid color for hero section (hex code, e.g., #050509)';
COMMENT ON COLUMN public.store_settings.hero_bg_gradient IS 'CSS gradient for hero section (e.g., linear-gradient(135deg, #667eea 0%, #764ba2 100%))';
COMMENT ON COLUMN public.store_settings.hero_bg_image_url IS 'Image URL for hero section background from Supabase Storage';

COMMENT ON COLUMN public.store_settings.gallery_section_bg_type IS 'Background type for gallery section: solid, gradient, image, or none';
COMMENT ON COLUMN public.store_settings.gallery_section_bg_color IS 'Solid color for gallery section (hex code)';
COMMENT ON COLUMN public.store_settings.gallery_section_bg_gradient IS 'CSS gradient for gallery section';
COMMENT ON COLUMN public.store_settings.gallery_section_bg_image_url IS 'Image URL for gallery section background';

COMMENT ON COLUMN public.store_settings.page_bg_type IS 'Background type for entire page: solid, gradient, image, or none';
COMMENT ON COLUMN public.store_settings.page_bg_color IS 'Solid color for page background (hex code)';
COMMENT ON COLUMN public.store_settings.page_bg_gradient IS 'CSS gradient for page background';
COMMENT ON COLUMN public.store_settings.page_bg_image_url IS 'Image URL for page background';

COMMENT ON COLUMN public.store_settings.hero_quote_bg_type IS 'Background type for hero quote section: solid, gradient, image, or none';
COMMENT ON COLUMN public.store_settings.hero_quote_bg_color IS 'Solid color for hero quote section (hex code)';
COMMENT ON COLUMN public.store_settings.hero_quote_bg_gradient IS 'CSS gradient for hero quote section';
COMMENT ON COLUMN public.store_settings.hero_quote_bg_image_url IS 'Image URL for hero quote section background';

-- Step 6: Set defaults for existing row (if it exists)
UPDATE public.store_settings
SET
  hero_bg_type = COALESCE(hero_bg_type, 'solid'),
  hero_bg_color = COALESCE(hero_bg_color, '#050509'),
  gallery_section_bg_type = COALESCE(gallery_section_bg_type, 'solid'),
  gallery_section_bg_color = COALESCE(gallery_section_bg_color, '#050509'),
  page_bg_type = COALESCE(page_bg_type, 'solid'),
  page_bg_color = COALESCE(page_bg_color, '#050509'),
  hero_quote_bg_type = COALESCE(hero_quote_bg_type, 'image')
WHERE singleton_guard = true;

-- Step 7: Verification
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'store_settings'
  AND column_name IN (
    'hero_bg_type', 'hero_bg_color', 'hero_bg_gradient', 'hero_bg_image_url',
    'gallery_section_bg_type', 'gallery_section_bg_color', 'gallery_section_bg_gradient', 'gallery_section_bg_image_url',
    'page_bg_type', 'page_bg_color', 'page_bg_gradient', 'page_bg_image_url',
    'hero_quote_bg_type', 'hero_quote_bg_color', 'hero_quote_bg_gradient', 'hero_quote_bg_image_url'
  );

  IF column_count < 16 THEN
    RAISE EXCEPTION 'Background settings migration failed: Expected 16 new columns but found %', column_count;
  END IF;

  RAISE NOTICE 'Background settings migration successful: % columns added', column_count;
END $$;

-- Optional verification query (run manually in SQL editor):
-- SELECT hero_bg_type, gallery_section_bg_type, page_bg_type, hero_quote_bg_type
-- FROM public.store_settings
-- WHERE singleton_guard = true;
