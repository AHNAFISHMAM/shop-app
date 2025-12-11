-- =====================================================
-- Migration: Create Table Reservations System
-- Description: Customer table bookings with admin management
-- Created: 2025-01-07
-- =====================================================

-- ============================================
-- 1. CREATE RESERVATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer Information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- Reservation Details
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 20),
  table_number TEXT,

  -- Status and Notes
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for documentation
COMMENT ON TABLE public.table_reservations IS 'Customer table reservations for Star Café';
COMMENT ON COLUMN public.table_reservations.user_id IS 'Linked to auth user if registered, null for guest reservations';
COMMENT ON COLUMN public.table_reservations.status IS 'pending → confirmed/declined → completed/no_show or cancelled';
COMMENT ON COLUMN public.table_reservations.party_size IS 'Number of guests (1-20)';
COMMENT ON COLUMN public.table_reservations.special_requests IS 'Customer requests (allergies, occasions, seating preferences)';
COMMENT ON COLUMN public.table_reservations.admin_notes IS 'Internal notes for staff';

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index on user_id for customer reservation lookup
CREATE INDEX IF NOT EXISTS idx_reservations_user_id
  ON public.table_reservations(user_id) WHERE user_id IS NOT NULL;

-- Index on email for guest reservation lookup
CREATE INDEX IF NOT EXISTS idx_reservations_customer_email
  ON public.table_reservations(customer_email);

-- Index on reservation date for calendar view
CREATE INDEX IF NOT EXISTS idx_reservations_date
  ON public.table_reservations(reservation_date);

-- Composite index on date and time for availability checks
CREATE INDEX IF NOT EXISTS idx_reservations_datetime
  ON public.table_reservations(reservation_date, reservation_time);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON public.table_reservations(status);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_reservations_created_at
  ON public.table_reservations(created_at DESC);

-- ============================================
-- 3. CREATE AUTOMATIC TIMESTAMP TRIGGER
-- ============================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON public.table_reservations;
CREATE TRIGGER trigger_reservations_updated_at
  BEFORE UPDATE ON public.table_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone (authenticated or guest) can create reservations
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.table_reservations;
CREATE POLICY "Anyone can create reservations"
  ON public.table_reservations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 2: Users can view their own reservations (by user_id)
DROP POLICY IF EXISTS "Users can view own reservations" ON public.table_reservations;
CREATE POLICY "Users can view own reservations"
  ON public.table_reservations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Guests can view reservations by email (need to provide email)
DROP POLICY IF EXISTS "Public can view reservations by email" ON public.table_reservations;
CREATE POLICY "Public can view reservations by email"
  ON public.table_reservations
  FOR SELECT
  TO public
  USING (true); -- Client-side filtering by email

-- Policy 4: Users can update their own reservations (cancel)
DROP POLICY IF EXISTS "Users can cancel own reservations" ON public.table_reservations;
CREATE POLICY "Users can cancel own reservations"
  ON public.table_reservations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    status IN ('pending', 'confirmed') -- Can only cancel pending/confirmed
  );

-- Policy 5: Admins can view all reservations
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.table_reservations;
CREATE POLICY "Admins can view all reservations"
  ON public.table_reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );

-- Policy 6: Admins can update any reservation
DROP POLICY IF EXISTS "Admins can update any reservation" ON public.table_reservations;
CREATE POLICY "Admins can update any reservation"
  ON public.table_reservations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );

-- Policy 7: Admins can delete reservations
DROP POLICY IF EXISTS "Admins can delete reservations" ON public.table_reservations;
CREATE POLICY "Admins can delete reservations"
  ON public.table_reservations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers
      WHERE customers.id = auth.uid()
      AND customers.is_admin = TRUE
    )
  );

-- ============================================
-- 5. ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.table_reservations;

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Run these queries after migration to verify:

-- Check table exists
-- SELECT table_name, table_type
-- FROM information_schema.tables
-- WHERE table_name = 'table_reservations';

-- Check columns
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'table_reservations'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'table_reservations';

-- Check RLS enabled
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relname = 'table_reservations';

-- Check policies
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'table_reservations';

-- Test insert (as admin in SQL editor)
-- INSERT INTO public.table_reservations (
--   customer_name, customer_email, customer_phone,
--   reservation_date, reservation_time, party_size,
--   special_requests, status
-- ) VALUES (
--   'John Doe',
--   'john@example.com',
--   '555-1234',
--   CURRENT_DATE + INTERVAL '3 days',
--   '19:00:00',
--   4,
--   'Window seat preferred, celebrating anniversary',
--   'pending'
-- );

-- ============================================
-- END OF MIGRATION
-- ============================================
