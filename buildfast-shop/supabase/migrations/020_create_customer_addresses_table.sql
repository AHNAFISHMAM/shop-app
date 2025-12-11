-- Migration: Create customer_addresses table
-- Description: Sets up the customer_addresses table for managing multiple shipping addresses per user
-- Run this in your Supabase SQL Editor

-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (label IN ('Home', 'Work', 'Office', 'Other')) DEFAULT 'Home',
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON public.customer_addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_customer_addresses_created_at ON public.customer_addresses(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_addresses_updated_at();

-- Create function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_one_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this address as default
  IF NEW.is_default = true THEN
    -- Unset all other addresses for this user
    UPDATE public.customer_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce one default address
DROP TRIGGER IF EXISTS enforce_one_default_address ON public.customer_addresses;
CREATE TRIGGER enforce_one_default_address
  BEFORE INSERT OR UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_one_default_address();

-- Create function to auto-set first address as default
CREATE OR REPLACE FUNCTION auto_set_first_address_default()
RETURNS TRIGGER AS $$
DECLARE
  address_count INTEGER;
BEGIN
  -- Count existing addresses for this user
  SELECT COUNT(*) INTO address_count
  FROM public.customer_addresses
  WHERE user_id = NEW.user_id;

  -- If this is the first address, make it default
  IF address_count = 0 THEN
    NEW.is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set first address as default
DROP TRIGGER IF EXISTS auto_set_first_address_default ON public.customer_addresses;
CREATE TRIGGER auto_set_first_address_default
  BEFORE INSERT ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_first_address_default();

-- Enable Row Level Security (RLS)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can create own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Admins can update all addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Admins can delete all addresses" ON public.customer_addresses;

-- Policy: Users can view their own addresses
CREATE POLICY "Users can view own addresses"
ON public.customer_addresses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can create their own addresses
CREATE POLICY "Users can create own addresses"
ON public.customer_addresses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own addresses
CREATE POLICY "Users can update own addresses"
ON public.customer_addresses FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
ON public.customer_addresses FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admins can view all addresses
CREATE POLICY "Admins can view all addresses"
ON public.customer_addresses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Admins can update all addresses
CREATE POLICY "Admins can update all addresses"
ON public.customer_addresses FOR UPDATE
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

-- Policy: Admins can delete all addresses
CREATE POLICY "Admins can delete all addresses"
ON public.customer_addresses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Add helpful comments
COMMENT ON TABLE public.customer_addresses IS 'Customer shipping addresses for multiple address management';
COMMENT ON COLUMN public.customer_addresses.is_default IS 'Only one address can be default per user (enforced by trigger)';
COMMENT ON COLUMN public.customer_addresses.label IS 'Address label: Home, Work, Office, or Other';
