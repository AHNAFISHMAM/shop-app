-- Migration: Add Low Stock Threshold to Products
-- Description: Adds low_stock_threshold column for inventory alerts
-- Run this in your Supabase SQL Editor or via supabase db push

-- Add low_stock_threshold column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold >= 0);

-- Add index for efficient low stock queries
-- This index helps when querying for products with low stock
CREATE INDEX IF NOT EXISTS idx_products_low_stock
ON public.products(stock_quantity, low_stock_threshold)
WHERE stock_quantity <= low_stock_threshold;

-- Add comment for documentation
COMMENT ON COLUMN public.products.low_stock_threshold IS 'Alert threshold - admin gets notified when stock_quantity falls to or below this value. Default: 10';

-- Note: No data migration needed - existing products will use default value of 10
