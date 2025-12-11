-- Migration: Create favorites table
-- Description: Allows users to save their favorite dishes for quick ordering
-- Created: 2025-11-07
-- Updated for Star Cafe: Favorites (not wishlist) - matches restaurant context

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_favorite_dish UNIQUE (user_id, product_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own favorite dishes
CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policy: Users can add dishes to their favorites
CREATE POLICY "Users can add to favorites"
ON public.favorites FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can remove dishes from their favorites
CREATE POLICY "Users can remove from favorites"
ON public.favorites FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add helpful comments
COMMENT ON TABLE public.favorites IS 'Customer favorite dishes - saved for quick reordering at Star Cafe';
COMMENT ON COLUMN public.favorites.user_id IS 'Reference to the customer who favorited this dish';
COMMENT ON COLUMN public.favorites.product_id IS 'Reference to the favorite dish';
COMMENT ON COLUMN public.favorites.created_at IS 'When the dish was added to favorites';
