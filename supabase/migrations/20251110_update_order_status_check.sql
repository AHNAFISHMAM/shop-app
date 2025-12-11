-- Migration: Update orders.status check constraint to support payment lifecycle
-- Allows Stripe webhook to set status = 'paid' or 'failed'

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'));

COMMENT ON CONSTRAINT orders_status_check ON public.orders IS
  'Ensures order status values align with Stripe payment + fulfillment lifecycle.';

DO $$
BEGIN
  RAISE NOTICE '✅ orders.status constraint updated to include paid/failed states';
END $$;

