-- =====================================================
-- CREATE RESERVATION SETTINGS TABLE
-- =====================================================
-- Copy this entire file and paste it into Supabase SQL Editor
-- Then click "Run" to create the table
-- =====================================================

-- Create reservation settings table
CREATE TABLE IF NOT EXISTS reservation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_time TIME NOT NULL DEFAULT '11:00:00',
  closing_time TIME NOT NULL DEFAULT '23:00:00',
  time_slot_interval INTEGER NOT NULL DEFAULT 30 CHECK (time_slot_interval IN (15, 30, 60)),
  max_capacity_per_slot INTEGER NOT NULL DEFAULT 50,
  max_party_size INTEGER NOT NULL DEFAULT 20,
  min_party_size INTEGER NOT NULL DEFAULT 1,
  operating_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT true,
  advance_booking_days INTEGER NOT NULL DEFAULT 30,
  enabled_occasions JSONB NOT NULL DEFAULT '["birthday","anniversary","business","date","celebration","casual"]',
  enabled_preferences JSONB NOT NULL DEFAULT '["window","quiet","bar","outdoor","any"]',
  blocked_dates JSONB NOT NULL DEFAULT '[]',
  special_notice TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO reservation_settings (id, opening_time, closing_time)
SELECT gen_random_uuid(), '11:00:00', '23:00:00'
WHERE NOT EXISTS (SELECT 1 FROM reservation_settings);

-- Enable RLS
ALTER TABLE reservation_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read reservation settings" ON reservation_settings;
DROP POLICY IF EXISTS "Only admins can update reservation settings" ON reservation_settings;

-- Anyone can read settings
CREATE POLICY "Anyone can read reservation settings"
  ON reservation_settings FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Only admins can update reservation settings"
  ON reservation_settings FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_reservation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_reservation_settings_updated_at ON reservation_settings;
CREATE TRIGGER trigger_update_reservation_settings_updated_at
  BEFORE UPDATE ON reservation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_settings_updated_at();

-- Verify table was created
SELECT 'Table created with ' || COUNT(*) || ' row(s)' AS status FROM reservation_settings;
