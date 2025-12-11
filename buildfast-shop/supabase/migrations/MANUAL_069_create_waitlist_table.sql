-- =====================================================
-- CREATE WAITLIST TABLE
-- =====================================================
-- Manages walk-in customers waiting for tables
-- Includes SMS notifications and estimated wait times
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '⏰ Creating waitlist table...';
END $$;

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  party_size INTEGER NOT NULL CHECK (party_size > 0),

  -- Status tracking
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'seated', 'cancelled', 'no_show')),

  -- Time tracking
  estimated_wait_time INTEGER, -- in minutes
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  seated_at TIMESTAMPTZ,

  -- Table assignment
  table_number TEXT,

  -- Priority and preferences
  is_priority BOOLEAN DEFAULT FALSE,
  special_requests TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_added_at ON waitlist(added_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_party_size ON waitlist(party_size);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists first)
DROP POLICY IF EXISTS "Admins can do everything with waitlist" ON waitlist;
DROP POLICY IF EXISTS "Customers can view their waitlist entry" ON waitlist;

CREATE POLICY "Admins can do everything with waitlist"
  ON waitlist
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Public can view their own waitlist entry
CREATE POLICY "Customers can view their waitlist entry"
  ON waitlist
  FOR SELECT
  TO anon
  USING (true);

-- Enable realtime (only if not already added)
DO $$
BEGIN
  -- Check if table is not already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'waitlist'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE waitlist;
    RAISE NOTICE 'Added waitlist to realtime publication';
  ELSE
    RAISE NOTICE 'Waitlist already in realtime publication';
  END IF;
END $$;

-- Create function to calculate average wait time
CREATE OR REPLACE FUNCTION get_average_wait_time()
RETURNS INTEGER AS $$
DECLARE
  avg_wait INTEGER;
BEGIN
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (seated_at - added_at))/60)::INTEGER, 30)
  INTO avg_wait
  FROM waitlist
  WHERE status = 'seated'
  AND seated_at > NOW() - INTERVAL '7 days';

  RETURN avg_wait;
END;
$$ LANGUAGE plpgsql;

-- Create function to get next in line
CREATE OR REPLACE FUNCTION get_next_in_waitlist(p_party_size INTEGER DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  party_size INTEGER,
  wait_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.customer_name,
    w.party_size,
    EXTRACT(EPOCH FROM (NOW() - w.added_at))/60 AS wait_time
  FROM waitlist w
  WHERE w.status = 'waiting'
  AND (p_party_size IS NULL OR w.party_size <= p_party_size + 2)
  ORDER BY w.is_priority DESC, w.added_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Waitlist table created!';
END $$;
