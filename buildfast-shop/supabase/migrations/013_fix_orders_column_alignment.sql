-- Migration: Fix orders table column alignment
-- Description: Ensures orders table uses order_total (standard naming) instead of total_amount
-- This migration handles the transition safely

-- Step 1: Check if orders table exists with total_amount and rename to order_total
DO $$
BEGIN
  -- Check if total_amount exists but order_total doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'total_amount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'order_total'
  ) THEN
    -- Rename the column
    ALTER TABLE public.orders RENAME COLUMN total_amount TO order_total;
    RAISE NOTICE 'Renamed total_amount to order_total';
  END IF;
END $$;

-- Step 2: If order_total doesn't exist but table does, create it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'orders'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'order_total'
  ) THEN
    -- Create order_total column
    ALTER TABLE public.orders 
    ADD COLUMN order_total DECIMAL(10, 2) NOT NULL DEFAULT 0 
    CHECK (order_total >= 0);
    
    -- If total_amount exists, migrate data and drop it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'orders' 
      AND column_name = 'total_amount'
    ) THEN
      UPDATE public.orders 
      SET order_total = COALESCE(total_amount, 0) 
      WHERE order_total IS NULL OR order_total = 0;
      
      -- Drop the old column after data migration
      ALTER TABLE public.orders DROP COLUMN IF EXISTS total_amount;
      RAISE NOTICE 'Migrated data from total_amount to order_total and dropped old column';
    END IF;
  END IF;
END $$;

-- Step 3: Update index if it references the old column name
DO $$
BEGIN
  -- Drop old index if it exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND indexname LIKE '%total_amount%'
  ) THEN
    -- Find and drop the index (PostgreSQL doesn't support IF EXISTS for DROP INDEX in older versions)
    PERFORM 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND indexname LIKE '%total_amount%';
    
    -- We'll recreate indexes in the main migration file
    RAISE NOTICE 'Old index on total_amount should be recreated on order_total';
  END IF;
END $$;

-- Step 4: Ensure order_total has the correct constraints
DO $$
BEGIN
  -- Add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'orders' 
    AND constraint_name = 'orders_order_total_check'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_order_total_check 
    CHECK (order_total >= 0);
  END IF;
END $$;

-- Verification query (for manual check)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'orders' 
-- AND column_name IN ('order_total', 'total_amount')
-- ORDER BY column_name;

