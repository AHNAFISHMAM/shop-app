-- =====================================================
-- ADD OCCASION AND PREFERENCE COLUMNS TO RESERVATIONS
-- =====================================================
-- Stores customer preferences for better service
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🍽️ Adding occasion and preference columns to table_reservations...';
END $$;

-- Add new columns for enhanced reservation experience
ALTER TABLE table_reservations
ADD COLUMN IF NOT EXISTS occasion TEXT,
ADD COLUMN IF NOT EXISTS table_preference TEXT;

-- Add comments for documentation
COMMENT ON COLUMN table_reservations.occasion IS 'Special occasion: birthday, anniversary, business, date, celebration, casual';
COMMENT ON COLUMN table_reservations.table_preference IS 'Table preference: window, quiet, bar, outdoor, any';

DO $$
BEGIN
  RAISE NOTICE '✅ Occasion and preference columns added successfully!';
END $$;
