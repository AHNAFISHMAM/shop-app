# 📋 SQL Migration Files - Run in Supabase

## ⚠️ Important Instructions

Run these SQL files in your Supabase SQL Editor **in this exact order**.

Most migrations should already be applied. **You only need to run the NEW ones (#24 and #25).**

---

## 🆕 **NEW Migrations to Run**

### **Migration 024: Transform to Restaurant** ✅ RUN THIS ONE FIRST

**File**: `supabase/migrations/024_transform_to_restaurant.sql`

**What it does**:
- Adds restaurant-specific columns to `products` table (dietary_tags, spice_level, chef_special, prep_time, portion_sizes)
- Adds restaurant-specific columns to `orders` table (order_type, table_number, delivery_time, special_instructions)
- Updates categories to: Appetizers, Main Course, Desserts, Beverages, Chef Specials
- Updates store settings to Star Café information

**How to run**:
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `024_transform_to_restaurant.sql`
4. Paste and click "Run"
5. Verify success (should see "Success. No rows returned")

### **Migration 025: Table Reservations System** ✅ RUN THIS ONE SECOND

**File**: `supabase/migrations/025_create_reservations_table.sql`

**What it does**:
- Creates `table_reservations` table for customer bookings
- Fields: customer info, reservation date/time, party size, table number, status, special requests
- RLS policies for customers and admin
- Real-time enabled for live updates
- Automatic timestamp triggers
- Indexes for performance

**How to run**:
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `025_create_reservations_table.sql`
4. Paste and click "Run"
5. Verify success (should see "Success. No rows returned")

---

## 🔧 **Fixed Migrations** (Optional - only if needed)

If you encounter errors with these older migrations, they've been fixed:

### **Migration 016: Guest Checkout RLS Policies** (Fixed)
**File**: `supabase/migrations/016_guest_checkout_rls_policies.sql`
- Fixed: Now idempotent (won't error if policies already exist)
- Status: Likely already applied

### **Migration 017: Add Customer Name Column** (Fixed)
**File**: `supabase/migrations/017_add_customer_name_column.sql`
- Fixed: JSONB operator check added
- Status: Likely already applied

---

## ✅ Verification Queries

After running migration 024, verify it worked with these queries:

```sql
-- 1. Check new columns in products table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('dietary_tags', 'spice_level', 'chef_special', 'prep_time', 'portion_sizes');

-- Expected: 5 rows returned

-- 2. Check new columns in orders table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('order_type', 'table_number', 'delivery_time', 'special_instructions', 'estimated_prep_time');

-- Expected: 5 rows returned

-- 3. Check restaurant categories
SELECT id, name, created_at
FROM public.categories
ORDER BY name;

-- Expected: Appetizers, Beverages, Chef Specials, Desserts, Main Course

-- 4. Check store settings updated
SELECT store_name, store_description, contact_email, contact_phone
FROM public.store_settings
LIMIT 1;

-- Expected: Star Café information

-- 5. Check indexes created
SELECT indexname FROM pg_indexes
WHERE tablename = 'products'
AND indexname IN ('idx_products_dietary_tags', 'idx_products_chef_special');

-- Expected: 2 indexes

SELECT indexname FROM pg_indexes
WHERE tablename = 'orders'
AND indexname IN ('idx_orders_order_type', 'idx_orders_delivery_time');

-- Expected: 2 indexes
```

---

## 🚨 Troubleshooting

### **Error: "relation already exists"**
→ Migration already ran successfully. Skip it.

### **Error: "policy already exists"**
→ Policy already created. Skip it.

### **Error: "column already exists"**
→ Column already added. Skip it.

### **Error: "operator does not exist: text ->> unknown"**
→ This was fixed in migration 017. Re-run the fixed version.

### **Error: "duplicate key value violates unique constraint"**
→ Migration already in schema_migrations table. Skip it.

---

## 📝 Summary

**TLDR**: Run migration files #024 and #025 in Supabase SQL Editor (in that order).

All other migrations should already be applied from your previous work.

---

## ✅ After Running Migrations

1. ✅ Migration 024 completed (restaurant transformation)
2. ✅ Migration 025 completed (reservations system)
3. ✅ Verification queries passed
4. ✅ Refresh your frontend at http://localhost:5178
5. ✅ Star Café with Reservations is ready! 🎉

---

## 🎯 Quick Copy-Paste Guide

**Step 1**: Open Supabase Dashboard
**Step 2**: Go to SQL Editor
**Step 3**: Click "New Query"
**Step 4**: Copy contents of `024_transform_to_restaurant.sql`
**Step 5**: Paste and click "Run"
**Step 6**: See success message ✅
**Step 7**: Click "New Query" again
**Step 8**: Copy contents of `025_create_reservations_table.sql`
**Step 9**: Paste and click "Run"
**Step 10**: See success message ✅
**Step 11**: Run verification queries above
**Step 12**: Done! 🎉
