-- =====================================================
-- RESERVATION SETTINGS TABLE
-- =====================================================
-- Admin-controlled settings for the reservation system
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '⚙️ Creating reservation_settings table...';
END $$;

-- Create reservation settings table (singleton - only one row)
CREATE TABLE IF NOT EXISTS reservation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operating Hours
  opening_time TIME NOT NULL DEFAULT '11:00:00',
  closing_time TIME NOT NULL DEFAULT '23:00:00',

  -- Time Slot Configuration
  time_slot_interval INTEGER NOT NULL DEFAULT 30 CHECK (time_slot_interval IN (15, 30, 60)),

  -- Capacity Settings
  max_capacity_per_slot INTEGER NOT NULL DEFAULT 50,
  max_party_size INTEGER NOT NULL DEFAULT 20,
  min_party_size INTEGER NOT NULL DEFAULT 1,

  -- Days of Operation (JSON array of day numbers: 0=Sunday, 6=Saturday)
  operating_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]',

  -- Feature Toggles
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT true,
  advance_booking_days INTEGER NOT NULL DEFAULT 30,

  -- Available Options (JSON arrays)
  enabled_occasions JSONB NOT NULL DEFAULT '["birthday","anniversary","business","date","celebration","casual"]',
  enabled_preferences JSONB NOT NULL DEFAULT '["window","quiet","bar","outdoor","any"]',

  -- Blocked Dates (JSON array of dates)
  blocked_dates JSONB NOT NULL DEFAULT '[]',

  -- Custom Messages
  special_notice TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings (only if table is empty)
INSERT INTO reservation_settings (id, opening_time, closing_time)
SELECT gen_random_uuid(), '11:00:00', '23:00:00'
WHERE NOT EXISTS (SELECT 1 FROM reservation_settings);

-- Create index
CREATE INDEX IF NOT EXISTS idx_reservation_settings_id ON reservation_settings(id);

-- Add RLS policies
ALTER TABLE reservation_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for customer-facing form)
CREATE POLICY "Anyone can read reservation settings"
  ON reservation_settings
  FOR SELECT
  USING (true);

-- Only authenticated users with admin role can update
CREATE POLICY "Only admins can update reservation settings"
  ON reservation_settings
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_reservation_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_reservation_settings_updated_at ON reservation_settings;
CREATE TRIGGER trigger_update_reservation_settings_updated_at
  BEFORE UPDATE ON reservation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_settings_updated_at();

-- Add helpful comments
COMMENT ON TABLE reservation_settings IS 'Global settings for the reservation system (singleton table)';
COMMENT ON COLUMN reservation_settings.time_slot_interval IS 'Time slot interval in minutes (15, 30, or 60)';
COMMENT ON COLUMN reservation_settings.operating_days IS 'Array of operating day numbers (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN reservation_settings.enabled_occasions IS 'Array of enabled occasion types';
COMMENT ON COLUMN reservation_settings.enabled_preferences IS 'Array of enabled table preferences';
COMMENT ON COLUMN reservation_settings.blocked_dates IS 'Array of blocked dates (YYYY-MM-DD format)';

DO $$
BEGIN
  RAISE NOTICE '✅ Reservation settings table created successfully!';
END $$;
