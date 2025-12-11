-- Emergency migration: Ensure customer_name column exists
-- This is a safe migration that only adds the column if it's missing

-- Add customer_name column (IF NOT EXISTS makes this safe to run multiple times)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Backfill existing orders with name from shipping_address (only if column was just created)
UPDATE public.orders
SET customer_name = shipping_address->>'fullName'
WHERE customer_name IS NULL AND shipping_address->>'fullName' IS NOT NULL;

-- Add index (IF NOT EXISTS makes this safe)
CREATE INDEX IF NOT EXISTS idx_orders_customer_name
  ON public.orders(customer_name);

-- Add comment
COMMENT ON COLUMN public.orders.customer_name IS 'Customer full name (guest or registered user)';
