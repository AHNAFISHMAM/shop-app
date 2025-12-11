-- =====================================================
-- Migration: Add stay-specific fields to table_reservations
-- Description: Supports check-in/out dates and room assignment metadata
-- Created: 2025-11-09
-- =====================================================

BEGIN;

ALTER TABLE public.table_reservations
  ADD COLUMN IF NOT EXISTS check_in_date DATE,
  ADD COLUMN IF NOT EXISTS check_out_date DATE,
  ADD COLUMN IF NOT EXISTS room_type TEXT,
  ADD COLUMN IF NOT EXISTS guest_notes TEXT;

UPDATE public.table_reservations
SET
  check_in_date = reservation_date
WHERE check_in_date IS NULL;

COMMIT;

