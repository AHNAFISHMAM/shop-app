-- Migration: Add guest checkout support
-- Description: Modify orders table to support guest users

-- 1. Make user_id nullable in orders (should already be nullable, but ensure it)
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest_session_id for tracking anonymous sessions
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_session_id TEXT;

-- 3. Add is_guest flag to easily identify guest orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- 4. Add index for guest session lookups
CREATE INDEX IF NOT EXISTS idx_orders_guest_session_id
  ON public.orders(guest_session_id)
  WHERE guest_session_id IS NOT NULL;

-- 5. Add index for is_guest flag
CREATE INDEX IF NOT EXISTS idx_orders_is_guest
  ON public.orders(is_guest);

-- 6. Update constraint to ensure either user_id or guest_session_id exists
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_user_or_guest_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_user_or_guest_check
  CHECK (
    (user_id IS NOT NULL AND is_guest = FALSE) OR
    (guest_session_id IS NOT NULL AND is_guest = TRUE)
  );

-- 7. Add payment_intent_id to track Stripe payments
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id
  ON public.orders(payment_intent_id);

-- Add comments for documentation
COMMENT ON COLUMN public.orders.guest_session_id IS 'Session ID for guest orders (NULL for authenticated users)';
COMMENT ON COLUMN public.orders.is_guest IS 'TRUE for guest orders, FALSE for authenticated user orders';
COMMENT ON COLUMN public.orders.payment_intent_id IS 'Stripe Payment Intent ID for tracking payment status';
