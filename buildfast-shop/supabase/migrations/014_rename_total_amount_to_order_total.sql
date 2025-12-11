-- Migration: Rename total_amount to order_total
-- Description: Standardizes the column name to match codebase conventions
-- This migration is idempotent and handles all scenarios safely
-- Run this directly in your Supabase SQL Editor

DO $$
DECLARE
  has_total_amount BOOLEAN;
  has_order_total BOOLEAN;
BEGIN
  -- Check which columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'total_amount'
  ) INTO has_total_amount;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'order_total'
  ) INTO has_order_total;

  -- Scenario 1: Both columns exist - migrate data and drop total_amount
  IF has_total_amount AND has_order_total THEN
    -- Copy data from total_amount to order_total if order_total is NULL or 0
    UPDATE public.orders 
    SET order_total = total_amount 
    WHERE (order_total IS NULL OR order_total = 0) AND total_amount IS NOT NULL;
    
    -- Drop the old column
    ALTER TABLE public.orders DROP COLUMN total_amount;
    RAISE NOTICE 'Migrated data from total_amount to order_total and dropped total_amount column';
  
  -- Scenario 2: Only total_amount exists - rename it
  ELSIF has_total_amount AND NOT has_order_total THEN
    ALTER TABLE public.orders RENAME COLUMN total_amount TO order_total;
    RAISE NOTICE 'Successfully renamed total_amount to order_total';
  
  -- Scenario 3: Only order_total exists - already done
  ELSIF NOT has_total_amount AND has_order_total THEN
    RAISE NOTICE 'Column order_total already exists - no action needed';
  
  -- Scenario 4: Neither exists - should not happen if orders table exists
  ELSE
    RAISE NOTICE 'Warning: Neither total_amount nor order_total found. Orders table may not exist or may have different structure.';
  END IF;
END $$;

-- Verification query (uncomment to check result)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'orders' 
-- AND column_name IN ('order_total', 'total_amount')
-- ORDER BY column_name;

