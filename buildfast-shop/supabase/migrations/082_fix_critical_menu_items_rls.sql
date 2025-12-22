-- =====================================================
-- MIGRATION 082: Fix Critical menu_items RLS Security Issue
-- CRITICAL: FIX_MENU_ITEMS_RLS.sql allows ANYONE to update menu_items!
-- This migration fixes that security vulnerability
-- Created: 2025-01-XX
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========== MIGRATION 082: Fix Critical menu_items RLS ==========';
  RAISE NOTICE '⚠️  CRITICAL SECURITY FIX: Removing overly permissive policy';
END $$;

-- ============================================
-- PART 1: Remove Dangerous Policy
-- ============================================

-- Drop the dangerous policy that allows anyone to update menu_items
DROP POLICY IF EXISTS "Allow all updates to menu_items" ON menu_items;

DO $$
BEGIN
  RAISE NOTICE '✓ Removed dangerous "Allow all updates to menu_items" policy';
END $$;

-- ============================================
-- PART 2: Ensure Secure Admin-Only Policies Exist
-- ============================================

-- Check if admin policies exist, if not create them
DO $$
DECLARE
  admin_policy_exists BOOLEAN;
BEGIN
  -- Check if admin policy exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menu_items'
      AND policyname LIKE '%admin%'
      AND cmd = 'UPDATE'
  ) INTO admin_policy_exists;

  -- If no admin UPDATE policy exists, create one
  IF NOT admin_policy_exists THEN
    -- Create admin-only UPDATE policy
    -- Check both customers.is_admin and auth.users.raw_user_meta_data for compatibility
    CREATE POLICY "Admins can update menu items"
      ON menu_items
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.customers
          WHERE customers.id = auth.uid()
          AND customers.is_admin = TRUE
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.customers
          WHERE customers.id = auth.uid()
          AND customers.is_admin = TRUE
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
      );

    RAISE NOTICE '✓ Created secure admin-only UPDATE policy for menu_items';
  ELSE
    RAISE NOTICE '✓ Admin UPDATE policy already exists for menu_items';
  END IF;
END $$;

-- ============================================
-- PART 3: Ensure Admin INSERT Policy Exists
-- ============================================

DO $$
DECLARE
  admin_insert_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menu_items'
      AND policyname LIKE '%admin%'
      AND cmd = 'INSERT'
  ) INTO admin_insert_exists;

  IF NOT admin_insert_exists THEN
    CREATE POLICY "Admins can insert menu items"
      ON menu_items
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.customers
          WHERE customers.id = auth.uid()
          AND customers.is_admin = TRUE
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
      );

    RAISE NOTICE '✓ Created secure admin-only INSERT policy for menu_items';
  ELSE
    RAISE NOTICE '✓ Admin INSERT policy already exists for menu_items';
  END IF;
END $$;

-- ============================================
-- PART 4: Ensure Admin DELETE Policy Exists
-- ============================================

DO $$
DECLARE
  admin_delete_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menu_items'
      AND policyname LIKE '%admin%'
      AND cmd = 'DELETE'
  ) INTO admin_delete_exists;

  IF NOT admin_delete_exists THEN
    CREATE POLICY "Admins can delete menu items"
      ON menu_items
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.customers
          WHERE customers.id = auth.uid()
          AND customers.is_admin = TRUE
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
      );

    RAISE NOTICE '✓ Created secure admin-only DELETE policy for menu_items';
  ELSE
    RAISE NOTICE '✓ Admin DELETE policy already exists for menu_items';
  END IF;
END $$;

-- ============================================
-- PART 5: Verify Public SELECT Policy Exists
-- ============================================

DO $$
DECLARE
  public_select_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menu_items'
      AND cmd = 'SELECT'
      AND roles = ARRAY['public']
  ) INTO public_select_exists;

  IF NOT public_select_exists THEN
    CREATE POLICY "Public can read available menu items"
      ON menu_items
      FOR SELECT
      TO public
      USING (is_available = true);

    RAISE NOTICE '✓ Created public SELECT policy for menu_items';
  ELSE
    RAISE NOTICE '✓ Public SELECT policy already exists for menu_items';
  END IF;
END $$;

-- ============================================
-- PART 6: Verification
-- ============================================

DO $$
DECLARE
  dangerous_policy_count INTEGER;
  admin_update_count INTEGER;
  admin_insert_count INTEGER;
  admin_delete_count INTEGER;
  public_select_count INTEGER;
BEGIN
  -- Check for dangerous policies
  SELECT COUNT(*) INTO dangerous_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'menu_items'
    AND (qual = 'true' OR with_check = 'true')
    AND cmd IN ('UPDATE', 'INSERT', 'DELETE');

  -- Count secure admin policies
  SELECT COUNT(*) INTO admin_update_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'menu_items'
    AND policyname LIKE '%admin%'
    AND cmd = 'UPDATE';

  SELECT COUNT(*) INTO admin_insert_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'menu_items'
    AND policyname LIKE '%admin%'
    AND cmd = 'INSERT';

  SELECT COUNT(*) INTO admin_delete_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'menu_items'
    AND policyname LIKE '%admin%'
    AND cmd = 'DELETE';

  SELECT COUNT(*) INTO public_select_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'menu_items'
    AND cmd = 'SELECT'
    AND roles = ARRAY['public'];

  RAISE NOTICE '';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '          MIGRATION 082 COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '==========================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security Status:';
  RAISE NOTICE '  • Dangerous policies removed: %', CASE WHEN dangerous_policy_count = 0 THEN '✅ YES' ELSE '❌ NO - ' || dangerous_policy_count || ' still exist!' END;
  RAISE NOTICE '  • Admin UPDATE policies: %', admin_update_count;
  RAISE NOTICE '  • Admin INSERT policies: %', admin_insert_count;
  RAISE NOTICE '  • Admin DELETE policies: %', admin_delete_count;
  RAISE NOTICE '  • Public SELECT policies: %', public_select_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Security Improvements:';
  RAISE NOTICE '  ✓ Removed "Allow all updates" policy (CRITICAL FIX)';
  RAISE NOTICE '  ✓ Ensured admin-only UPDATE/INSERT/DELETE policies';
  RAISE NOTICE '  ✓ Maintained public SELECT for available items';
  RAISE NOTICE '';
  
  IF dangerous_policy_count > 0 THEN
    RAISE WARNING '⚠️  WARNING: % dangerous policies still exist! Review manually.', dangerous_policy_count;
  END IF;
  
  RAISE NOTICE '==========================================================';
END $$;

