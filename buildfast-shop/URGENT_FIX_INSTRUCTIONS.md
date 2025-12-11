# 🚨 URGENT: Fix SQL Not Working + Hide Deleted Dishes

## ✅ DONE: Deleted Dishes Are Now Hidden
- ✅ AdminDishes: Only shows active dishes
- ✅ OrderPage: Already filters by availability
- ✅ MenuPage: Shows menu_items (new system)
- ✅ Customers: Cannot see inactive dishes

---

## 🔍 ROOT CAUSE RESEARCH: Why SQL Scripts Fail

Based on common Supabase issues, here are the **TOP 5 REASONS** your SQL scripts didn't work:

### 1️⃣ **RLS Policies Blocking Inserts** (MOST COMMON)
**Problem**: Row Level Security prevents non-authenticated inserts
**Symptoms**: Script runs but tables stay empty
**Fix**: Run `FIX_RLS_AND_SEED.sql` (temporarily disables RLS)

### 2️⃣ **Transaction Rollback**
**Problem**: Script has an error midway, entire transaction rolls back
**Symptoms**: No error shown, but data disappears
**Fix**: Run diagnostic script first to catch errors

### 3️⃣ **Foreign Key Constraint Errors**
**Problem**: Category IDs don't match between insert statements
**Symptoms**: Categories load but items fail
**Fix**: Use explicit UUIDs in both tables

### 4️⃣ **Copy-Paste Errors**
**Problem**: Script wasn't fully copied or got truncated
**Symptoms**: Script stops partway through
**Fix**: Copy from file, not from screen

### 5️⃣ **Running in Wrong Database**
**Problem**: Multiple Supabase projects, ran in wrong one
**Symptoms**: Script succeeds but data not in your app
**Fix**: Verify project URL matches

---

## 🛠️ STEP-BY-STEP FIX (Do This NOW)

### STEP 1: Run Diagnostic Script
This will tell you exactly what's wrong:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Click **SQL Editor** → **New Query**
3. Open file: `supabase/migrations/000_DIAGNOSTIC_CHECK.sql`
4. Copy **ALL CONTENT** (Ctrl+A, Ctrl+C)
5. Paste into Supabase → Click **Run** ▶️
6. Read the output messages carefully

**What to look for:**
```
❌ menu_items table is EMPTY!
Root cause: RLS policies blocking inserts
✅ Solution: Run FIX_RLS_AND_SEED.sql
```

---

### STEP 2: Run the Fix Script
This fixes RLS issues and loads sample data:

1. Click **New Query** again
2. Open file: `supabase/migrations/FIX_RLS_AND_SEED.sql`
3. Copy **ALL CONTENT**
4. Paste → Click **Run** ▶️
5. Should see: "✅ SEEDING COMPLETE!"

**This script:**
- ✅ Temporarily disables RLS
- ✅ Clears any bad data
- ✅ Inserts 20 categories
- ✅ Inserts 20 sample items (to verify it works)
- ✅ Re-enables RLS with correct policies

---

### STEP 3: Verify It Worked
Run this query to check:

```sql
-- Check if data loaded
SELECT
    (SELECT COUNT(*) FROM menu_categories) as categories,
    (SELECT COUNT(*) FROM menu_items) as items;
```

**Expected Result:**
- Categories: 20
- Items: 20 (sample data to verify it works)

---

### STEP 4: Load Full Menu (150+ Items)
Once you confirm Step 3 works:

1. Click **New Query**
2. Open: `supabase/migrations/COMPLETE_STAR_CAFE_SEED.sql`
3. **IMPORTANT**: Find this section at the top:
   ```sql
   -- Clear existing data
   TRUNCATE TABLE menu_items CASCADE;
   TRUNCATE TABLE menu_categories CASCADE;
   ```
4. Copy ALL → Paste → Run
5. Should see: "✅ COMPLETE STAR CAFÉ MENU SEEDED!" with 150+ items

---

## 📊 Common Error Messages & Solutions

### Error: "relation menu_items does not exist"
**Solution**: You didn't run Step 1 (schema creation). Run `MANUAL_star_cafe_menu_complete.sql` first.

### Error: "permission denied for table menu_items"
**Solution**: RLS is blocking you. Run `FIX_RLS_AND_SEED.sql` which fixes this.

### Error: "violates foreign key constraint"
**Solution**: Category IDs mismatch. Run `FIX_RLS_AND_SEED.sql` which uses correct UUIDs.

### No Error But Tables Empty
**Solution**: Transaction rolled back silently. Run `000_DIAGNOSTIC_CHECK.sql` to see why.

---

## 🎯 Quick Verification Commands

After each step, run these to verify:

```sql
-- 1. Check tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('menu_categories', 'menu_items');

-- 2. Count rows
SELECT
    'menu_categories' as table_name, COUNT(*) as rows FROM menu_categories
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items;

-- 3. See sample data
SELECT name, price FROM menu_items LIMIT 5;
```

---

## 🔄 If Still Not Working

### Nuclear Option: Complete Reset

```sql
-- WARNING: This deletes everything!
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;

-- Then run FIX_RLS_AND_SEED.sql
```

---

## ✅ Success Checklist

After running the fix:
- [ ] Diagnostic shows: "✅ menu_items has data!"
- [ ] Query returns 20 categories, 20+ items
- [ ] `/admin/menu-items` shows dishes in your app
- [ ] `/menu` displays the public menu
- [ ] Old dishes are hidden (go to `/admin/dishes` - should be empty or minimal)

---

## 📞 Still Stuck?

If none of this works, run this final diagnostic:

```sql
-- Show me EVERYTHING
SELECT
    'Tables' as type,
    tablename as name
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT
    'RLS Policy' as type,
    tablename || '.' || policyname as name
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY type, name;
```

Send me this output and I'll tell you exactly what's wrong.

---

## 🎉 Expected Final State

When everything works:
1. **Admin Dishes** (`/admin/dishes`): Empty or only active dishes (old system)
2. **Admin Menu Items** (`/admin/menu-items`): 150+ Star Café dishes
3. **Public Menu** (`/menu`): All 150+ dishes in 20 categories
4. **Order Page** (`/order`): Menu items available to order

---

**NOW GO RUN THOSE SCRIPTS! 🚀**

Files to run in order:
1. `000_DIAGNOSTIC_CHECK.sql` ← Find the problem
2. `FIX_RLS_AND_SEED.sql` ← Fix RLS and load sample data
3. `COMPLETE_STAR_CAFE_SEED.sql` ← Load full 150+ menu (if Step 2 worked)
