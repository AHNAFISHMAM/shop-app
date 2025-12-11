-- ============================================================================
-- MIGRATION: Enforce Single Admin User
-- ============================================================================
-- This migration ensures that ONLY wisani8762@aupvs.com can be an admin.
-- All other users will automatically have is_admin = false at all times.
--
-- Actions:
-- 1. Update existing users to remove admin privileges (except wisani8762@aupvs.com)
-- 2. Create trigger function to enforce single admin rule
-- 3. Create trigger on customers table for INSERT and UPDATE
-- ============================================================================

-- Step 1: Update all existing users to remove admin privileges except wisani8762@aupvs.com
UPDATE public.customers
SET is_admin = false
WHERE email != 'wisani8762@aupvs.com';

-- Step 2: Ensure wisani8762@aupvs.com is admin (in case they exist)
UPDATE public.customers
SET is_admin = true
WHERE email = 'wisani8762@aupvs.com';

-- Step 3: Create trigger function to enforce single admin rule
CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow wisani8762@aupvs.com to be admin
  IF NEW.email = 'wisani8762@aupvs.com' THEN
    -- This user can be admin
    NEW.is_admin := true;
  ELSE
    -- All other users must be non-admin
    NEW.is_admin := false;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 4: Create trigger on INSERT and UPDATE
DROP TRIGGER IF EXISTS enforce_single_admin_trigger ON public.customers;

CREATE TRIGGER enforce_single_admin_trigger
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_admin();

-- Add comment for documentation
COMMENT ON FUNCTION public.enforce_single_admin() IS
  'Ensures only wisani8762@aupvs.com can have admin privileges. All other users are automatically set to is_admin = false.';

-- Verification query (run this to confirm):
-- SELECT email, is_admin FROM public.customers ORDER BY is_admin DESC, email;
