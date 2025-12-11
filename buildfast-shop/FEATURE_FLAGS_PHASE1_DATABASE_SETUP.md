# Phase 1: Database Setup and Verification

## Overview
This phase sets up the database for feature flags by running the migration and verifying all configurations.

---

## Step 1: Run Database Migration

### Location
File: `supabase/migrations/076_add_feature_flags.sql`

### Instructions

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run Migration**
   - Copy the entire contents of `supabase/migrations/076_add_feature_flags.sql`
   - Paste into SQL Editor
   - Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

3. **Verify Success**
   - Check for success message: `✅ Feature flags added successfully!`
   - If errors occur, check:
     - Table `store_settings` exists
     - You have sufficient permissions
     - No conflicting migrations

---

## Step 2: Verify Migration

### Query 1: Check All Feature Flag Columns Exist

```sql
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'store_settings'
  AND column_name IN (
    'enable_loyalty_program',
    'enable_reservations',
    'enable_menu_filters',
    'enable_product_customization',
    'enable_order_tracking',
    'enable_order_feedback',
    'enable_marketing_optins',
    'enable_quick_reorder'
  )
ORDER BY column_name;
```

**Expected Result:**
- 8 rows returned
- All `data_type` = `boolean`
- All `column_default` = `true`
- All `is_nullable` = `NO`

### Query 2: Verify Default Values

```sql
SELECT 
  enable_loyalty_program,
  enable_reservations,
  enable_menu_filters,
  enable_product_customization,
  enable_order_tracking,
  enable_order_feedback,
  enable_marketing_optins,
  enable_quick_reorder
FROM public.store_settings
WHERE singleton_guard = true;
```

**Expected Result:**
- 1 row returned
- All 8 columns = `true`

### Query 3: Check Column Comments

```sql
SELECT 
  column_name,
  col_description(pgc.oid, ordinal_position) AS column_comment
FROM information_schema.columns isc
JOIN pg_class pgc ON pgc.relname = isc.table_name
WHERE isc.table_schema = 'public'
  AND isc.table_name = 'store_settings'
  AND isc.column_name LIKE 'enable_%'
ORDER BY isc.column_name;
```

**Expected Result:**
- 8 rows returned
- All columns have descriptive comments

---

## Step 3: Verify RLS Policies

### Query 1: Check RLS Policies for store_settings

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'store_settings';
```

**Expected Result:**
- At least 1 SELECT policy for public read access
- At least 1 UPDATE policy for authenticated users (admin)

### Query 2: Verify RLS is Enabled

```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'store_settings';
```

**Expected Result:**
- `rowsecurity` = `true`

### If RLS Policies Are Missing

Create the following policies:

```sql
-- Allow public read access to store_settings
CREATE POLICY "Allow public read access to store_settings"
ON public.store_settings
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to update store_settings (admin only)
CREATE POLICY "Allow authenticated users to update store_settings"
ON public.store_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## Step 4: Enable Real-Time Replication

### Instructions

1. **Open Supabase Dashboard**
   - Go to **Database** → **Replication**
   - Find `store_settings` table in the list

2. **Enable Replication**
   - Toggle the switch for `store_settings` table
   - Verify it shows as **Enabled**

### Verify Replication is Enabled

```sql
SELECT 
  schemaname,
  tablename,
  replident
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'store_settings';
```

**Expected Result:**
- 1 row returned
- `replident` = `d` (default) or `f` (full)

### If Replication is Not Enabled

Run this SQL:

```sql
-- Add store_settings to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
```

---

## Step 5: Final Verification

### Comprehensive Check Query

```sql
-- Check all feature flags exist and have correct defaults
SELECT 
  'Migration Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status,
  COUNT(*) AS columns_found,
  8 AS columns_expected
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'store_settings'
  AND column_name IN (
    'enable_loyalty_program',
    'enable_reservations',
    'enable_menu_filters',
    'enable_product_customization',
    'enable_order_tracking',
    'enable_order_feedback',
    'enable_marketing_optins',
    'enable_quick_reorder'
  )

UNION ALL

-- Check default values
SELECT 
  'Default Values Check' AS check_type,
  CASE 
    WHEN enable_loyalty_program = true
      AND enable_reservations = true
      AND enable_menu_filters = true
      AND enable_product_customization = true
      AND enable_order_tracking = true
      AND enable_order_feedback = true
      AND enable_marketing_optins = true
      AND enable_quick_reorder = true
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status,
  1 AS columns_found,
  1 AS columns_expected
FROM public.store_settings
WHERE singleton_guard = true

UNION ALL

-- Check RLS policies
SELECT 
  'RLS Policies Check' AS check_type,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status,
  COUNT(*) AS columns_found,
  1 AS columns_expected
FROM pg_policies
WHERE tablename = 'store_settings'

UNION ALL

-- Check real-time replication
SELECT 
  'Real-time Replication Check' AS check_type,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status,
  COUNT(*) AS columns_found,
  1 AS columns_expected
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'store_settings';
```

**Expected Result:**
- All 4 checks show `✅ PASS`

---

## Troubleshooting

### Issue: Migration Fails with "Column Already Exists"

**Solution:**
```sql
-- Check if columns already exist
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'store_settings'
  AND column_name LIKE 'enable_%';

-- If columns exist but migration failed, manually update defaults
UPDATE public.store_settings
SET 
  enable_loyalty_program = COALESCE(enable_loyalty_program, true),
  enable_reservations = COALESCE(enable_reservations, true),
  enable_menu_filters = COALESCE(enable_menu_filters, true),
  enable_product_customization = COALESCE(enable_product_customization, true),
  enable_order_tracking = COALESCE(enable_order_tracking, true),
  enable_order_feedback = COALESCE(enable_order_feedback, true),
  enable_marketing_optins = COALESCE(enable_marketing_optins, true),
  enable_quick_reorder = COALESCE(enable_quick_reorder, true)
WHERE singleton_guard = true;
```

### Issue: RLS Policies Block Public Read

**Solution:**
```sql
-- Verify current policies
SELECT * FROM pg_policies WHERE tablename = 'store_settings';

-- Create public read policy if missing
CREATE POLICY "Allow public read access to store_settings"
ON public.store_settings
FOR SELECT
TO public
USING (true);
```

### Issue: Real-Time Replication Not Working

**Solution:**
```sql
-- Check if table is in publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'store_settings';

-- Add table to publication if missing
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

-- Verify replication is enabled in Supabase Dashboard
-- Go to Database → Replication → Enable for store_settings
```

---

## Success Criteria

- [ ] Migration runs successfully
- [ ] All 8 feature flag columns exist
- [ ] All default values are `true`
- [ ] RLS policies allow public read access
- [ ] Real-time replication is enabled
- [ ] All verification queries pass

---

## Next Steps

After completing Phase 1:
1. Proceed to **Phase 2: Code Fixes** (Already completed)
2. Proceed to **Phase 3-7: Testing** (See `FEATURE_FLAGS_TESTING_GUIDE.md`)

---

## Additional Resources

- Migration file: `supabase/migrations/076_add_feature_flags.sql`
- Testing guide: `FEATURE_FLAGS_TESTING_GUIDE.md`
- Implementation summary: See main README or documentation

