-- Migration: Add seller_id to products table
-- Description: Adds seller_id field to track product ownership and enables user-specific editing
-- Run this in your Supabase SQL Editor

-- Step 1: Add seller_id column to products table
-- This will be null for existing products, but new products will have the creator's ID
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.products.seller_id IS 'UUID of the user who created/sells this product. Allows only the seller to edit their products.';

-- Step 3: Create index for faster queries on seller_id
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);

-- Step 4: For existing products without a seller_id, we can't determine ownership
-- Leave them as NULL - admins can still edit them, but users cannot

-- Step 5: Update RLS policies to allow sellers to insert and edit their own products

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Sellers can insert own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can view own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete own products" ON public.products;

-- Policy: Allow authenticated users to insert products (seller_id will be set automatically)
CREATE POLICY "Sellers can insert own products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (
  seller_id = auth.uid()  -- Users can only create products with themselves as seller
);

-- Policy: Allow sellers to view their own products
CREATE POLICY "Sellers can view own products"
ON public.products FOR SELECT
TO authenticated
USING (
  seller_id = auth.uid()  -- Users can view products they created
  OR
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )  -- Admins can view all products
);

-- Policy: Allow sellers to update their own products
CREATE POLICY "Sellers can update own products"
ON public.products FOR UPDATE
TO authenticated
USING (
  seller_id = auth.uid()  -- User can only update products they created
)
WITH CHECK (
  seller_id = auth.uid()  -- Ensure they can't change seller_id to someone else's
);

-- Policy: Allow sellers to delete their own products
CREATE POLICY "Sellers can delete own products"
ON public.products FOR DELETE
TO authenticated
USING (
  seller_id = auth.uid()  -- User can only delete products they created
);

-- Step 6: Update existing admin policies (admins can still do everything)
-- These policies use OR conditions so admins have full access
-- Note: Admin policies already exist from 001_create_products_table.sql
-- They will work alongside seller policies (PostgreSQL RLS uses OR logic)

-- Note: After this migration:
-- 1. New products will automatically have seller_id set to the creator's auth.uid()
-- 2. Only the seller (or an admin) can edit a product
-- 3. Existing products will have NULL seller_id (only admins can edit those)

