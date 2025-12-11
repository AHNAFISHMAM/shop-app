-- Migration: Check and Fix Products Table Structure
-- Description: Verifies products table has correct columns, adds missing ones if needed
-- Run this if you get "column stock_quantity does not exist" error

-- Step 1: Check current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- Step 2: If products table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 3: Add missing columns if table exists but is missing columns
DO $$ 
BEGIN
  -- Add stock_quantity if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0);
  END IF;

  -- Add category if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.products ADD COLUMN category TEXT NOT NULL DEFAULT 'Other';
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
  END IF;
END $$;

-- Step 4: Verify structure again
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- Step 5: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- Step 6: Create update trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable RLS and create policies (if not already done)
-- Run the RLS policies from 001_create_products_table.sql
-- OR continue with setup...

