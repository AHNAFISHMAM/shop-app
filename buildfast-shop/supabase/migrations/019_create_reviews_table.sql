-- Migration: Create product_reviews table
-- Description: Sets up the product reviews and ratings system with RLS policies
-- Run this in your Supabase SQL Editor or via migration

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_review_per_order_item UNIQUE (order_item_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON public.product_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_hidden ON public.product_reviews(is_hidden);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON public.product_reviews(order_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_reviews_updated_at();

-- Create helper function to verify user purchased product
CREATE OR REPLACE FUNCTION verify_user_purchased_product(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS TABLE (
  order_id UUID,
  order_item_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id as order_id, oi.id as order_item_id
  FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE oi.product_id = p_product_id
    AND (o.user_id = p_user_id OR (o.user_id IS NULL AND o.customer_email IN (
      SELECT email FROM auth.users WHERE id = p_user_id
    )))
    AND o.status IN ('delivered', 'shipped', 'processing')
    AND NOT EXISTS (
      SELECT 1 FROM public.product_reviews pr
      WHERE pr.order_item_id = oi.id
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get average rating for a product
CREATE OR REPLACE FUNCTION get_product_average_rating(p_product_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT ROUND(AVG(rating)::numeric, 1)
  INTO avg_rating
  FROM public.product_reviews
  WHERE product_id = p_product_id
    AND is_hidden = false;

  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get review count for a product
CREATE OR REPLACE FUNCTION get_product_review_count(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  review_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO review_count
  FROM public.product_reviews
  WHERE product_id = p_product_id
    AND is_hidden = false;

  RETURN COALESCE(review_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to get rating distribution for a product
CREATE OR REPLACE FUNCTION get_product_rating_distribution(p_product_id UUID)
RETURNS TABLE (
  rating INTEGER,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_reviews INTEGER;
BEGIN
  -- Get total non-hidden reviews
  SELECT COUNT(*)
  INTO total_reviews
  FROM public.product_reviews
  WHERE product_id = p_product_id
    AND is_hidden = false;

  -- Return distribution
  RETURN QUERY
  SELECT
    r.rating,
    COUNT(pr.id) as count,
    CASE
      WHEN total_reviews > 0 THEN ROUND((COUNT(pr.id)::numeric / total_reviews * 100), 1)
      ELSE 0
    END as percentage
  FROM (SELECT generate_series(1, 5) as rating) r
  LEFT JOIN public.product_reviews pr
    ON pr.rating = r.rating
    AND pr.product_id = p_product_id
    AND pr.is_hidden = false
  GROUP BY r.rating
  ORDER BY r.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Public can view non-hidden reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can create reviews for purchased products" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.product_reviews;

-- Policy: Public can view non-hidden reviews
CREATE POLICY "Public can view non-hidden reviews"
ON public.product_reviews FOR SELECT
TO public
USING (is_hidden = false);

-- Policy: Authenticated users can view all their own reviews (including hidden ones)
CREATE POLICY "Users can view own reviews"
ON public.product_reviews FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can create reviews for products they've purchased
CREATE POLICY "Users can create reviews for purchased products"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE oi.id = order_item_id
      AND oi.product_id = product_id
      AND (o.user_id = auth.uid() OR (o.user_id IS NULL AND o.customer_email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )))
      AND o.status IN ('delivered', 'shipped', 'processing')
  )
);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.product_reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.product_reviews FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admins can view all reviews (including hidden)
CREATE POLICY "Admins can view all reviews"
ON public.product_reviews FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Admins can update any review (to hide/unhide)
CREATE POLICY "Admins can update reviews"
ON public.product_reviews FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Admins can delete any review
CREATE POLICY "Admins can delete reviews"
ON public.product_reviews FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Add helpful comments
COMMENT ON TABLE public.product_reviews IS 'Product reviews and ratings from verified purchasers';
COMMENT ON COLUMN public.product_reviews.is_verified_purchase IS 'Badge to show this is from a verified buyer';
COMMENT ON COLUMN public.product_reviews.is_hidden IS 'Admin moderation flag to hide inappropriate reviews';
COMMENT ON COLUMN public.product_reviews.review_images IS 'Array of image URLs uploaded with review';
