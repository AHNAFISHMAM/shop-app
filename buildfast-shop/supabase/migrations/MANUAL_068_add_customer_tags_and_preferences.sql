-- =====================================================
-- ADD CUSTOMER TAGS AND PREFERENCES
-- =====================================================
-- Adds customer relationship management features
-- Tracks VIP status, preferences, tags, and visit history
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '👤 Adding customer tags and preferences...';
END $$;

-- Add CRM columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_visit_date DATE,
ADD COLUMN IF NOT EXISTS favorite_table TEXT,
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;

-- Create index for VIP customers
CREATE INDEX IF NOT EXISTS idx_customers_is_vip ON customers(is_vip) WHERE is_vip = TRUE;

-- Create index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING GIN(tags);

-- Add columns to track reservation source (works with both table names)
DO $$
BEGIN
  -- Try to add to table_reservations if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'table_reservations') THEN
    ALTER TABLE table_reservations
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website',
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_first_visit BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS occasion TEXT;

    RAISE NOTICE 'Added columns to table_reservations';
  END IF;

  -- Try to add to reservations if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
    ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website',
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_first_visit BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS occasion TEXT;

    RAISE NOTICE 'Added columns to reservations';
  END IF;
END $$;

-- Create function to update customer stats
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update customer stats when reservation is completed
    UPDATE customers
    SET
      total_visits = total_visits + 1,
      last_visit_date = NEW.reservation_date
    WHERE email = NEW.customer_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both possible table names
DO $$
BEGIN
  -- Trigger for table_reservations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'table_reservations') THEN
    DROP TRIGGER IF EXISTS trigger_update_customer_stats ON table_reservations;
    CREATE TRIGGER trigger_update_customer_stats
      AFTER UPDATE ON table_reservations
      FOR EACH ROW
      EXECUTE FUNCTION update_customer_stats();

    RAISE NOTICE 'Created trigger on table_reservations';
  END IF;

  -- Trigger for reservations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
    DROP TRIGGER IF EXISTS trigger_update_customer_stats ON reservations;
    CREATE TRIGGER trigger_update_customer_stats
      AFTER UPDATE ON reservations
      FOR EACH ROW
      EXECUTE FUNCTION update_customer_stats();

    RAISE NOTICE 'Created trigger on reservations';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Customer tags and preferences added!';
END $$;
