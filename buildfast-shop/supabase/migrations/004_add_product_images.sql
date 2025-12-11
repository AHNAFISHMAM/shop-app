-- Migration: Add product images support
-- Description: Adds images column to store product image URLs and sets up storage bucket
-- Run this in your Supabase SQL Editor

-- Step 1: Add images column to products table (stores array of image URLs)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.products.images IS 'Array of product image URLs stored in Supabase Storage';

-- Step 3: Create storage bucket for product images (if it doesn't exist)
-- Note: This will fail if bucket already exists, which is fine
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,  -- Public bucket so images can be accessed directly
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create storage policies for product images bucket
-- Note: Drop existing policies first to allow re-running the migration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;

-- Policy: Allow admins to upload images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to update their uploaded images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow public to read product images
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

