# Migration Status Check - URGENT

## MOST LIKELY CAUSE OF "Failed to submit review" Error

**The `product_reviews` table doesn't exist in your database yet!**

## How to Verify

1. **Open Supabase Dashboard** → SQL Editor
2. **Run this query**:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'product_reviews'
) as table_exists;
```

### Expected Results:

- **If `table_exists: false`** → **THIS IS YOUR PROBLEM!** The migration was never applied.
- **If `table_exists: true`** → The table exists, issue is something else.

---

## HOW TO FIX (If migration not applied)

### Step 1: Apply the Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open this file: `supabase/migrations/20251106030641_create_reviews_table.sql`
3. **Copy the ENTIRE contents** (all 241 lines)
4. **Paste into SQL Editor**
5. Click **RUN**

### Step 2: Verify It Worked

Run this verification script in SQL Editor:

```sql
-- Should return: table_exists = true
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'product_reviews'
) as table_exists;

-- Should return: 4 (four RPC functions)
SELECT COUNT(*) as function_count
FROM pg_proc
WHERE proname IN (
  'verify_user_purchased_product',
  'get_product_average_rating',
  'get_product_review_count',
  'get_product_rating_distribution'
);

-- Should return: 7 or more policies
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'product_reviews';
```

**Expected Results**:
- `table_exists: true`
- `function_count: 4`
- `policy_count: 7`

If all three match, the migration was applied successfully!

---

## Other Possible Issues (If migration IS applied)

### Issue 2: You Haven't Ordered This Product

The reviews feature requires you to have **purchased the product** first. Check:

```sql
-- Replace YOUR_USER_ID and YOUR_PRODUCT_ID with actual values from console logs
SELECT
  o.id as order_id,
  o.status,
  o.user_id,
  oi.id as order_item_id,
  p.name as product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.user_id = 'YOUR_USER_ID'
  AND oi.product_id = 'YOUR_PRODUCT_ID';
```

**If this returns NO ROWS**: You haven't ordered this product, so you can't review it.

**If this returns rows but status is 'pending'**: Change the order status to 'delivered':

```sql
UPDATE orders
SET status = 'delivered'
WHERE id = 'YOUR_ORDER_ID';
```

---

## Quick Fix for Testing

If you want to test reviews WITHOUT ordering products, you can temporarily modify the RLS policy:

**WARNING: This removes purchase verification - ONLY for testing!**

```sql
-- TEMPORARY: Allow any authenticated user to create reviews
DROP POLICY IF EXISTS "Users can create reviews for purchased products" ON public.product_reviews;

CREATE POLICY "Users can create reviews for purchased products"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

**Remember to restore the original policy after testing!** (Re-run the migration)

---

## What to Do Next

1. **Check if migration is applied** (query above)
2. **If NO**: Apply the migration (Step 1)
3. **If YES**: Check if you have eligible orders (Issue 2)
4. **Open browser console** (F12) and try to submit a review again
5. **Copy the entire console output** and send it to me

The debug logs will show exactly what's failing.
