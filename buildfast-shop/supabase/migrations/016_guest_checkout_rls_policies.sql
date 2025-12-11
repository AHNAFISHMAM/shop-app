-- Migration: Update RLS policies for guest checkout
-- Description: Allow unauthenticated users to create orders and order_items

-- ==============================
-- ORDERS TABLE POLICIES
-- ==============================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Allow ANY user (authenticated or not) to INSERT orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'orders'
    AND policyname = 'Anyone can create orders'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO public WITH CHECK (true)';
  END IF;
END $$;

-- Update SELECT policy to allow viewing by both user_id and guest_session_id
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Guests can view own orders by session" ON public.orders;
DROP POLICY IF EXISTS "Users and guests can view own orders" ON public.orders;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'orders'
    AND policyname = 'Users and guests can view own orders'
  ) THEN
    EXECUTE 'CREATE POLICY "Users and guests can view own orders" ON public.orders FOR SELECT TO public USING ((user_id = auth.uid()) OR (is_guest = TRUE AND guest_session_id IS NOT NULL))';
  END IF;
END $$;

-- ==============================
-- ORDER_ITEMS TABLE POLICIES
-- ==============================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Allow ANY user to INSERT order_items for valid orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'order_items'
    AND policyname = 'Anyone can create order items'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id))';
  END IF;
END $$;

-- Update SELECT policy to allow viewing order_items for accessible orders
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view order items for accessible orders" ON public.order_items;
DROP POLICY IF EXISTS "Users and guests can view order items for accessible orders" ON public.order_items;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'order_items'
    AND policyname = 'Users and guests can view order items for accessible orders'
  ) THEN
    EXECUTE 'CREATE POLICY "Users and guests can view order items for accessible orders" ON public.order_items FOR SELECT TO public USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR orders.is_guest = TRUE)))';
  END IF;
END $$;

-- ==============================
-- CART_ITEMS - NO CHANGES NEEDED
-- ==============================
-- Cart items remain auth-only. Guests use localStorage.
-- Keep existing RLS policies unchanged.

-- ==============================
-- ADMIN POLICIES (unchanged)
-- ==============================
-- Admins can still view/update all orders regardless of guest status
-- Existing admin policies remain in effect
