-- ============================================================================
-- MIGRATION: Admin Management RPC Functions
-- ============================================================================
-- Secure functions for managing admin users via email
-- Only existing admins can add/remove other admins
-- ============================================================================

-- Step 1: Remove the single admin enforcement trigger if it exists
DROP TRIGGER IF EXISTS enforce_single_admin_trigger ON public.customers;
DROP FUNCTION IF EXISTS public.enforce_single_admin();

-- Step 2: Create RPC function to add admin by email
CREATE OR REPLACE FUNCTION public.add_admin_by_email(target_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  target_user_email TEXT;
  target_user_name TEXT;
  current_user_is_admin BOOLEAN;
BEGIN
  -- Verify current user is admin
  SELECT is_admin INTO current_user_is_admin
  FROM public.customers
  WHERE id = auth.uid();
  
  IF NOT current_user_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins can add other admins'
    );
  END IF;
  
  -- Find user by email
  SELECT id, email, COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'fullName',
    split_part(email, '@', 1)
  ) INTO target_user_id, target_user_email, target_user_name
  FROM auth.users
  WHERE email = LOWER(TRIM(target_email));
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found: No account exists with this email'
    );
  END IF;
  
  -- Create or update customer record with admin privileges
  INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
  VALUES (
    target_user_id,
    target_user_email,
    target_user_name,
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET is_admin = true,
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.customers.full_name);
  
  RETURN json_build_object(
    'success', true,
    'message', 'Admin privileges granted successfully',
    'user_id', target_user_id,
    'email', target_user_email
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to add admin: ' || SQLERRM
    );
END;
$$;

-- Step 3: Create RPC function to remove admin by email
CREATE OR REPLACE FUNCTION public.remove_admin_by_email(target_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  current_user_is_admin BOOLEAN;
  admin_count INTEGER;
BEGIN
  -- Verify current user is admin
  SELECT is_admin INTO current_user_is_admin
  FROM public.customers
  WHERE id = auth.uid();
  
  IF NOT current_user_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins can remove admin privileges'
    );
  END IF;
  
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(target_email));
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found: No account exists with this email'
    );
  END IF;
  
  -- Prevent removing yourself
  IF target_user_id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot remove your own admin privileges'
    );
  END IF;
  
  -- Check how many admins exist
  SELECT COUNT(*) INTO admin_count
  FROM public.customers
  WHERE is_admin = true;
  
  -- Prevent removing the last admin
  IF admin_count <= 1 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot remove the last admin. At least one admin must remain.'
    );
  END IF;
  
  -- Remove admin privileges
  UPDATE public.customers
  SET is_admin = false
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found in customers table'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Admin privileges removed successfully',
    'user_id', target_user_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to remove admin: ' || SQLERRM
    );
END;
$$;

-- Step 4: Create RPC function to list all admins
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_is_admin BOOLEAN;
  admins JSON;
BEGIN
  -- Verify current user is admin
  SELECT is_admin INTO current_user_is_admin
  FROM public.customers
  WHERE id = auth.uid();
  
  IF NOT current_user_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins can view admin list'
    );
  END IF;
  
  -- Get all admins
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'email', c.email,
      'full_name', c.full_name,
      'created_at', c.created_at
    )
    ORDER BY c.created_at ASC
  ) INTO admins
  FROM public.customers c
  WHERE c.is_admin = true;
  
  RETURN json_build_object(
    'success', true,
    'admins', COALESCE(admins, '[]'::json)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to list admins: ' || SQLERRM
    );
END;
$$;

-- Step 5: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_admin_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.add_admin_by_email(TEXT) IS
  'Adds admin privileges to a user by email. Only existing admins can use this function.';
COMMENT ON FUNCTION public.remove_admin_by_email(TEXT) IS
  'Removes admin privileges from a user by email. Cannot remove yourself or the last admin.';
COMMENT ON FUNCTION public.list_admins() IS
  'Returns a list of all users with admin privileges. Only admins can use this function.';

