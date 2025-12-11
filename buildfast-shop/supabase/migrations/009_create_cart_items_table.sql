-- Migration: Create cart_items table
-- Description: Sets up the cart_items table with RLS policies for user-specific cart management
-- Run this in your Supabase SQL Editor
-- NOTE: Requires customers table to exist (run 002_setup_admin_user.sql first if needed)

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Ensure one cart item per user per product (user can only have one entry per product)
  UNIQUE(user_id, product_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON public.cart_items(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;

-- Policy: Allow users to view their own cart items
CREATE POLICY "Users can view own cart items"
ON public.cart_items FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Allow users to insert their own cart items
CREATE POLICY "Users can insert own cart items"
ON public.cart_items FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Allow users to update their own cart items
CREATE POLICY "Users can update own cart items"
ON public.cart_items FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Allow users to delete their own cart items
CREATE POLICY "Users can delete own cart items"
ON public.cart_items FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add helpful comments
COMMENT ON TABLE public.cart_items IS 'Shopping cart items - each user can manage their own cart';
COMMENT ON COLUMN public.cart_items.user_id IS 'UUID of the user who owns this cart item';
COMMENT ON COLUMN public.cart_items.product_id IS 'UUID of the product in the cart';
COMMENT ON COLUMN public.cart_items.quantity IS 'Number of items (must be greater than 0)';
COMMENT ON COLUMN public.cart_items.created_at IS 'When the cart item was first added';
COMMENT ON COLUMN public.cart_items.updated_at IS 'When the cart item was last updated (quantity changed)';

