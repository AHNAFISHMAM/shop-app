-- Migration: Add customer_name column to orders table
-- Description: Separate name field as requested in spec

-- Add customer_name column
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Backfill existing orders with name from shipping_address (only if JSONB)
DO $$
BEGIN
  -- Check if shipping_address is JSONB type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'shipping_address'
    AND data_type = 'jsonb'
  ) THEN
    -- Safe to use ->> operator
    UPDATE public.orders
    SET customer_name = shipping_address->>'fullName'
    WHERE customer_name IS NULL AND shipping_address->>'fullName' IS NOT NULL;
  END IF;
END $$;

-- Add index for searching by name
CREATE INDEX IF NOT EXISTS idx_orders_customer_name
  ON public.orders(customer_name);

-- Add comment
COMMENT ON COLUMN public.orders.customer_name IS 'Customer full name (guest or registered user)';
