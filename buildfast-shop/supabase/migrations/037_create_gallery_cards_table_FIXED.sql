-- ============================================================================
-- MIGRATION: Create Dynamic Gallery Cards System (FIXED)
-- ============================================================================
-- Creates a flexible gallery_cards table for admin-managed gallery with hover effects
-- FIXED: Ensures 3 default cards are always created + correct RLS policies
-- ============================================================================

-- Step 1: Create gallery_cards table
CREATE TABLE IF NOT EXISTS public.gallery_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INTEGER NOT NULL,
  default_image_url TEXT NOT NULL,
  hover_image_url TEXT NOT NULL,
  effect TEXT NOT NULL CHECK (effect IN ('crossfade', 'slide', 'scalefade')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for ordering
CREATE INDEX IF NOT EXISTS idx_gallery_cards_position ON public.gallery_cards(position);
CREATE INDEX IF NOT EXISTS idx_gallery_cards_active ON public.gallery_cards(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.gallery_cards IS 'Gallery cards for About page with default and hover images';
COMMENT ON COLUMN public.gallery_cards.position IS 'Display order (1, 2, 3, ...)';
COMMENT ON COLUMN public.gallery_cards.default_image_url IS 'URL of default image from Supabase Storage';
COMMENT ON COLUMN public.gallery_cards.hover_image_url IS 'URL of hover state image from Supabase Storage';
COMMENT ON COLUMN public.gallery_cards.effect IS 'Hover animation effect: crossfade, slide, or scalefade';
COMMENT ON COLUMN public.gallery_cards.is_active IS 'Whether card is displayed on About page';

-- Step 2: Enable Row Level Security
ALTER TABLE public.gallery_cards ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies (FIXED: Use anon and authenticated instead of public)

-- Allow anonymous AND authenticated users to view active gallery cards
DROP POLICY IF EXISTS "Public can view active gallery cards" ON public.gallery_cards;
CREATE POLICY "Public can view active gallery cards"
ON public.gallery_cards FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow admins to view all gallery cards (including inactive)
DROP POLICY IF EXISTS "Admins can view all gallery cards" ON public.gallery_cards;
CREATE POLICY "Admins can view all gallery cards"
ON public.gallery_cards FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
);

-- Allow admins to insert gallery cards
DROP POLICY IF EXISTS "Admins can insert gallery cards" ON public.gallery_cards;
CREATE POLICY "Admins can insert gallery cards"
ON public.gallery_cards FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
);

-- Allow admins to update gallery cards
DROP POLICY IF EXISTS "Admins can update gallery cards" ON public.gallery_cards;
CREATE POLICY "Admins can update gallery cards"
ON public.gallery_cards FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
);

-- Allow admins to delete gallery cards
DROP POLICY IF EXISTS "Admins can delete gallery cards" ON public.gallery_cards;
CREATE POLICY "Admins can delete gallery cards"
ON public.gallery_cards FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = auth.uid()
    AND customers.is_admin = true
  )
);

-- Step 4: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_gallery_cards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_gallery_cards_updated_at ON public.gallery_cards;
CREATE TRIGGER set_gallery_cards_updated_at
  BEFORE UPDATE ON public.gallery_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gallery_cards_updated_at();

-- Step 5: FIXED - Always create 3 default cards (with fallback if store_settings doesn't exist)
DO $$
DECLARE
  store_settings_exists boolean;
  card_count integer;
BEGIN
  -- Check if store_settings table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'store_settings'
  ) INTO store_settings_exists;

  -- Check if we already have cards
  SELECT COUNT(*) INTO card_count FROM public.gallery_cards;

  -- Only insert if no cards exist yet
  IF card_count = 0 THEN
    -- Try to migrate from store_settings if it exists
    IF store_settings_exists THEN
      -- Attempt to migrate existing data
      INSERT INTO public.gallery_cards (position, default_image_url, hover_image_url, effect, is_active)
      SELECT
        1 as position,
        COALESCE(about_gallery_image_1, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80') as default_image_url,
        COALESCE(about_gallery_image_1_hover, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80') as hover_image_url,
        'crossfade' as effect,
        true as is_active
      FROM public.store_settings
      WHERE singleton_guard = true
      LIMIT 1;

      INSERT INTO public.gallery_cards (position, default_image_url, hover_image_url, effect, is_active)
      SELECT
        2 as position,
        COALESCE(about_gallery_image_2, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80') as default_image_url,
        COALESCE(about_gallery_image_2_hover, 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80') as hover_image_url,
        'slide' as effect,
        true as is_active
      FROM public.store_settings
      WHERE singleton_guard = true
      LIMIT 1;

      INSERT INTO public.gallery_cards (position, default_image_url, hover_image_url, effect, is_active)
      SELECT
        3 as position,
        COALESCE(about_gallery_image_3, 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80') as default_image_url,
        COALESCE(about_gallery_image_3_hover, 'https://images.unsplash.com/photo-1591189863345-ba0cc0f49a83?w=800&q=80') as hover_image_url,
        'scalefade' as effect,
        true as is_active
      FROM public.store_settings
      WHERE singleton_guard = true
      LIMIT 1;
    END IF;

    -- Re-check card count after attempted migration
    SELECT COUNT(*) INTO card_count FROM public.gallery_cards;

    -- If still no cards (store_settings didn't exist or had no data), create defaults
    IF card_count = 0 THEN
      INSERT INTO public.gallery_cards (position, default_image_url, hover_image_url, effect, is_active)
      VALUES
        (1, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', 'crossfade', true),
        (2, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&q=80', 'slide', true),
        (3, 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80', 'https://images.unsplash.com/photo-1591189863345-ba0cc0f49a83?w=800&q=80', 'scalefade', true);
    END IF;
  END IF;
END $$;

-- Step 6: Enable realtime for gallery_cards table
DO $$
BEGIN
  -- Check if table is already in publication, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'gallery_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_cards;
  END IF;
END $$;

-- Verification: Ensure at least 3 cards exist
DO $$
DECLARE
  final_count integer;
BEGIN
  SELECT COUNT(*) INTO final_count FROM public.gallery_cards;

  IF final_count < 3 THEN
    RAISE EXCEPTION 'Migration failed: Expected at least 3 gallery cards but found %', final_count;
  END IF;

  RAISE NOTICE 'Gallery cards migration successful: % cards created', final_count;
END $$;

-- Optional verification queries (run manually in SQL editor):
-- SELECT * FROM public.gallery_cards ORDER BY position;
-- SELECT count(*) FROM public.gallery_cards;
