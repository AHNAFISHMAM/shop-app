-- Migration: Auto-create customer record when user signs up
-- This ensures every authenticated user has a corresponding customer record
-- Fixes the issue where admin status cannot be determined for users without customer records

-- Create function to automatically create customer record on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert customer record with data from auth.users
  INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'fullName',
      split_part(NEW.email, '@', 1)  -- Fallback to email username
    ),
    false,  -- Default to non-admin (admins must be set manually)
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Skip if record already exists

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create customer records for any existing users that don't have them
INSERT INTO public.customers (id, email, full_name, is_admin, created_at)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'fullName',
    split_part(u.email, '@', 1)
  ) as full_name,
  false as is_admin,
  u.created_at
FROM auth.users u
LEFT JOIN public.customers c ON c.id = u.id
WHERE c.id IS NULL;  -- Only insert if customer record doesn't exist

-- Comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a customer record when a new user signs up via Supabase Auth. This ensures every authenticated user has a corresponding entry in the customers table with is_admin defaulting to false.';
