-- Migration: Allow general favorite comments without linked items
-- Created: 2025-11-12

ALTER TABLE public.favorite_comments
  DROP CONSTRAINT IF EXISTS favorite_comments_target_check;

ALTER TABLE public.favorite_comments
  ADD CONSTRAINT favorite_comments_target_check
  CHECK (
    (menu_item_id IS NOT NULL AND product_id IS NULL)
    OR (menu_item_id IS NULL AND product_id IS NOT NULL)
    OR (menu_item_id IS NULL AND product_id IS NULL)
  );

