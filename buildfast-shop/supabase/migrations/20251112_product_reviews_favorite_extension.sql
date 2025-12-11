-- Migration: Extend product_reviews to support favorite-sourced feedback
-- Created: 2025-11-12

-- 1. Relax constraints to allow non-purchase feedback
ALTER TABLE public.product_reviews
  ALTER COLUMN rating DROP NOT NULL,
  ALTER COLUMN product_id DROP NOT NULL,
  ALTER COLUMN order_id DROP NOT NULL,
  ALTER COLUMN order_item_id DROP NOT NULL;

ALTER TABLE public.product_reviews
  DROP CONSTRAINT IF EXISTS unique_review_per_order_item;

-- 2. Add favorite-specific columns
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'purchase' CHECK (source IN ('purchase', 'favorite')),
  ADD COLUMN IF NOT EXISTS favorite_is_general BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorite_target_label TEXT;

CREATE INDEX IF NOT EXISTS idx_product_reviews_source ON public.product_reviews(source);
CREATE INDEX IF NOT EXISTS idx_product_reviews_menu_item_id ON public.product_reviews(menu_item_id);

-- 3. Replace insert policies to account for favorite submissions
DROP POLICY IF EXISTS "Users can create reviews for purchased products" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can create purchase reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can create favorite reviews" ON public.product_reviews;

CREATE POLICY "Users can create purchase reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (
  source = 'purchase'
  AND user_id = auth.uid()
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

CREATE POLICY "Users can create favorite reviews"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (
  source = 'favorite'
  AND user_id = auth.uid()
);

-- 4. Migrate existing favorite comments into product_reviews (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'favorite_comments'
  ) THEN
    INSERT INTO public.product_reviews (
      id,
      product_id,
      menu_item_id,
      user_id,
      rating,
      review_text,
      review_images,
      is_verified_purchase,
      is_hidden,
      created_at,
      updated_at,
      source,
      favorite_is_general,
      favorite_target_label
    )
    SELECT
      gen_random_uuid(),
      NULL, -- avoid FK to products; favorites may reference dishes instead
      fc.menu_item_id,
      fc.user_id,
      NULL,
      fc.comment,
      fc.image_urls,
      false,
      false,
      fc.created_at,
      fc.created_at,
      'favorite',
      (fc.menu_item_id IS NULL AND fc.product_id IS NULL),
      COALESCE(mi.name, di.name, 'General Feedback')
    FROM public.favorite_comments fc
    LEFT JOIN public.menu_items mi ON mi.id = fc.menu_item_id
    LEFT JOIN public.dishes di ON di.id = fc.product_id;

    DROP TABLE public.favorite_comments;
  END IF;
END $$;

-- 5. (Optional) ensure updated_at trigger still exists (recreate to be safe)
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_reviews_updated_at();

