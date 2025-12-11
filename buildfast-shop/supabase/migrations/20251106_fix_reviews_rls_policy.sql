-- FIX: Review submission RLS policy - Remove auth.users access
-- This fixes the "permission denied for table users" error (42501)

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can create reviews for purchased products" ON public.product_reviews;

-- Create fixed policy (simplified - no guest order email matching in RLS)
-- Note: Guest order support is still handled by the RPC function which has SECURITY DEFINER
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
      AND o.user_id = auth.uid()
      AND o.status IN ('delivered', 'shipped', 'processing')
  )
);
