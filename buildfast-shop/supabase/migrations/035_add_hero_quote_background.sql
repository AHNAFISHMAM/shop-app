-- ============================================================================
-- MIGRATION: Add Hero Quote Background Image Support
-- ============================================================================
-- This migration adds support for dynamic hero quote background images:
-- 1. Adds hero_quote_bg_url column to store_settings table
-- 2. Creates public storage bucket for background images
-- 3. Sets up policies for anonymous uploads with validation
-- ============================================================================

-- Add hero_quote_bg_url column to store_settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS hero_quote_bg_url TEXT;

-- Add about gallery image columns (default images)
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS about_gallery_image_1 TEXT,
ADD COLUMN IF NOT EXISTS about_gallery_image_2 TEXT,
ADD COLUMN IF NOT EXISTS about_gallery_image_3 TEXT;

-- Add about gallery hover image columns
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS about_gallery_image_1_hover TEXT,
ADD COLUMN IF NOT EXISTS about_gallery_image_2_hover TEXT,
ADD COLUMN IF NOT EXISTS about_gallery_image_3_hover TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.store_settings.hero_quote_bg_url IS 'URL of the uploaded hero quote background image from Supabase Storage. Falls back to default asset if null.';
COMMENT ON COLUMN public.store_settings.about_gallery_image_1 IS 'First about page gallery default image URL from Supabase Storage. Falls back to default if null.';
COMMENT ON COLUMN public.store_settings.about_gallery_image_2 IS 'Second about page gallery default image URL from Supabase Storage. Falls back to default if null.';
COMMENT ON COLUMN public.store_settings.about_gallery_image_3 IS 'Third about page gallery default image URL from Supabase Storage. Falls back to default if null.';
COMMENT ON COLUMN public.store_settings.about_gallery_image_1_hover IS 'First about page gallery hover image URL from Supabase Storage. Displayed on hover with crossfade animation.';
COMMENT ON COLUMN public.store_settings.about_gallery_image_2_hover IS 'Second about page gallery hover image URL from Supabase Storage. Displayed on hover with slide+fade animation.';
COMMENT ON COLUMN public.store_settings.about_gallery_image_3_hover IS 'Third about page gallery hover image URL from Supabase Storage. Displayed on hover with scale+crossfade animation.';

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================

-- Create public storage bucket for background images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'background-images',
  'background-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Anyone can upload background images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view background images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete background images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update background images" ON storage.objects;

-- Policy: Allow anyone to upload images (anonymous upload)
CREATE POLICY "Anyone can upload background images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'background-images'
  AND (
    (storage.foldername(name))[1] = 'hero-quotes' OR
    (storage.foldername(name))[1] = 'about-gallery'
  )
  AND (
    LOWER(RIGHT(name, 4)) = '.jpg' OR
    LOWER(RIGHT(name, 4)) = '.png' OR
    LOWER(RIGHT(name, 5)) = '.webp' OR
    LOWER(RIGHT(name, 5)) = '.jpeg'
  )
);

-- Policy: Allow anyone to view/download background images (public bucket)
CREATE POLICY "Anyone can view background images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'background-images');

-- Policy: Allow admins to delete background images
CREATE POLICY "Admins can delete background images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'background-images'
  AND EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to update background images
CREATE POLICY "Admins can update background images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'background-images'
  AND EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'background-images'
  AND EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow anyone to update store_settings hero_quote_bg_url (for anonymous uploads)
-- Note: This is a specific exception to allow anonymous users to update ONLY the hero_quote_bg_url field
-- We need to drop existing policies and recreate them to add this exception
DROP POLICY IF EXISTS "Public can update hero quote background" ON public.store_settings;
DROP POLICY IF EXISTS "Anyone can update hero quote background" ON public.store_settings;

CREATE POLICY "Anyone can update hero quote background"
ON public.store_settings FOR UPDATE
TO public
USING (true)
WITH CHECK (
  -- Allow update only if:
  -- 1. Only hero_quote_bg_url column is being changed
  -- 2. The new URL is from the background-images bucket
  hero_quote_bg_url IS NOT NULL
  AND hero_quote_bg_url LIKE '%/storage/v1/object/public/background-images/%'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that column was added
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'store_settings'
-- AND column_name = 'hero_quote_bg_url';

-- Check storage bucket was created
-- SELECT id, name, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- WHERE id = 'background-images';

-- Check storage policies exist
-- SELECT policyname, tablename, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'objects'
-- AND policyname LIKE '%background%';
