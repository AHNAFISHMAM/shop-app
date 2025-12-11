-- ============================================================================
-- MIGRATION: Create Store Settings Table
-- ============================================================================
-- This migration creates the store_settings table for managing store configuration
-- including tax rates, shipping, currency, contact info, and social media links.
-- ============================================================================

-- Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Buildfast Shop',
  store_description TEXT DEFAULT 'Your one-stop shop for everything you need',
  store_logo_url TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  shipping_type TEXT DEFAULT 'flat' CHECK (shipping_type IN ('flat', 'free_over_amount', 'free')),
  shipping_cost DECIMAL(10, 2) DEFAULT 0.00 CHECK (shipping_cost >= 0),
  free_shipping_threshold DECIMAL(10, 2) CHECK (free_shipping_threshold >= 0),
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),
  store_hours TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  return_policy TEXT DEFAULT 'We accept returns within 30 days of purchase. Items must be in original condition.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_store_settings_created_at ON public.store_settings(created_at DESC);

-- Add singleton column before insert (order matters!)
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS singleton_guard BOOLEAN DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_settings_singleton ON public.store_settings (singleton_guard);

-- Insert default settings (singleton pattern - only one row should exist)
-- Only insert if no rows exist yet
INSERT INTO public.store_settings (
  store_name,
  store_description,
  tax_rate,
  shipping_type,
  shipping_cost,
  currency,
  return_policy
)
SELECT
  'Buildfast Shop',
  'Your one-stop shop for everything you need',
  0.00,
  'flat',
  5.00,
  'USD',
  'We accept returns within 30 days of purchase. Items must be in original condition with tags attached. Refunds will be processed to the original payment method within 5-7 business days.'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings LIMIT 1);

-- Enable Row Level Security (RLS)
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Admins can view store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can insert store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;

-- Policy: Allow admins to view store settings
CREATE POLICY "Admins can view store settings"
ON public.store_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to update store settings
CREATE POLICY "Admins can update store settings"
ON public.store_settings FOR UPDATE
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

-- Policy: Allow admins to insert store settings (in case table is empty)
CREATE POLICY "Admins can insert store settings"
ON public.store_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow public (unauthenticated) users to view store settings
-- This is necessary so the frontend can display store name, tax rates, shipping info, etc.
CREATE POLICY "Public can view store settings"
ON public.store_settings FOR SELECT
TO public
USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
DROP TRIGGER IF EXISTS trigger_update_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trigger_update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_store_settings_updated_at();

-- Enable realtime for store settings (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'store_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration worked)
-- ============================================================================

-- Check that the table was created
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'store_settings'
) AS table_exists;

-- Check that default settings were inserted
SELECT
  store_name,
  tax_rate,
  shipping_type,
  shipping_cost,
  currency
FROM public.store_settings;

-- Check that RLS is enabled
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'store_settings';
