-- Migration: Add favorite comments with secure storage policies
-- Description: Enables monthly customer comments on favorite dishes with image uploads
-- Created: 2025-11-12

-- =============================================================================
-- TABLE: favorite_comments
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.favorite_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.dishes(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.favorite_comments
  ADD CONSTRAINT favorite_comments_comment_length
  CHECK (char_length(trim(comment)) BETWEEN 1 AND 300);

ALTER TABLE public.favorite_comments
  ADD CONSTRAINT favorite_comments_target_check
  CHECK (
    (menu_item_id IS NOT NULL AND product_id IS NULL)
    OR (menu_item_id IS NULL AND product_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_favorite_comments_user
  ON public.favorite_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_comments_created_at
  ON public.favorite_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorite_comments_menu_item
  ON public.favorite_comments(menu_item_id)
  WHERE menu_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_favorite_comments_product
  ON public.favorite_comments(product_id)
  WHERE product_id IS NOT NULL;

COMMENT ON TABLE public.favorite_comments IS 'Monthly customer feedback on favorite dishes';
COMMENT ON COLUMN public.favorite_comments.user_id IS 'Customer providing the feedback';
COMMENT ON COLUMN public.favorite_comments.menu_item_id IS 'Linked menu_items record when applicable';
COMMENT ON COLUMN public.favorite_comments.product_id IS 'Linked dishes record when applicable';
COMMENT ON COLUMN public.favorite_comments.comment IS 'Professional customer feedback (1-300 chars)';
COMMENT ON COLUMN public.favorite_comments.image_urls IS 'Up to three supporting image URLs stored in Supabase Storage';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.favorite_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read favorite comments" ON public.favorite_comments;
DROP POLICY IF EXISTS "Users insert favorite comments" ON public.favorite_comments;
DROP POLICY IF EXISTS "Users delete favorite comments" ON public.favorite_comments;

CREATE POLICY "Users read favorite comments"
ON public.favorite_comments FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users insert favorite comments"
ON public.favorite_comments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete favorite comments"
ON public.favorite_comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================================================
-- STORAGE BUCKET FOR COMMENT IMAGES
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'favorite-comment-images',
  'favorite-comment-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Favorite comment images upload" ON storage.objects;
DROP POLICY IF EXISTS "Favorite comment images read" ON storage.objects;
DROP POLICY IF EXISTS "Favorite comment images delete" ON storage.objects;

CREATE POLICY "Favorite comment images upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'favorite-comment-images'
  AND position('/' IN name) > 0
  AND (
    LOWER(RIGHT(name, 4)) IN ('.jpg', '.png')
    OR LOWER(RIGHT(name, 5)) IN ('.jpeg', '.webp')
  )
);

CREATE POLICY "Favorite comment images read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'favorite-comment-images');

CREATE POLICY "Favorite comment images delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'favorite-comment-images'
  AND EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- =============================================================================
-- VERIFICATION QUERIES (optional)
-- =============================================================================
-- SELECT * FROM public.favorite_comments LIMIT 1;
-- SELECT * FROM storage.buckets WHERE id = 'favorite-comment-images';

