# Reviews Feature - Debug Checklist

## Step 1: Check Browser Console NOW

Open the browser console (F12) and look for these debug messages when you try to submit a review:

```
=== REVIEW SUBMISSION DEBUG ===
User ID: [your user id]
Product ID: [product id]
Order ID: [order id or null]
Order Item ID: [order item id or null]
Rating: [1-5]
Review Text: [your text]
Images to upload: [number]
```

Then look for:

```
=== CREATE REVIEW API CALL ===
Inserting review data: {...}
```

**If you see an ERROR after that, copy the ENTIRE error message and send it to me.**

---

## Step 2: Verify Database Migration Applied

Run this SQL in Supabase SQL Editor:

```sql
-- Check if product_reviews table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'product_reviews'
) as table_exists;
```

**Expected**: `table_exists: true`

**If FALSE**: The migration was NOT applied. Go apply it now:
1. Open Supabase Dashboard
2. SQL Editor
3. Copy contents of `supabase/migrations/20251106030641_create_reviews_table.sql`
4. Paste and RUN

---

## Step 3: Check RLS Policies

```sql
-- Check RLS policies on product_reviews
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'product_reviews';
```

**Expected**: You should see at least 7 policies including:
- `Users can create reviews for purchased products`
- `Public can view non-hidden reviews`
- `Users can view own reviews`

---

## Step 4: Verify You Have a Delivered Order

```sql
-- Replace YOUR_USER_ID with your actual user ID from Step 1
-- Replace YOUR_PRODUCT_ID with the product you're trying to review

SELECT
  o.id as order_id,
  oi.id as order_item_id,
  o.status,
  p.name as product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.user_id = 'YOUR_USER_ID'
  AND oi.product_id = 'YOUR_PRODUCT_ID';
```

**Expected**: You should see at least ONE row with status = 'delivered', 'shipped', or 'processing'

**If EMPTY**: You haven't ordered this product yet! That's why you can't review it.

---

## Step 5: Test the RPC Function

```sql
-- Replace YOUR_USER_ID and YOUR_PRODUCT_ID with actual values
SELECT * FROM verify_user_purchased_product(
  'YOUR_USER_ID'::uuid,
  'YOUR_PRODUCT_ID'::uuid
);
```

**Expected**: Should return `order_id` and `order_item_id`

**If EMPTY**: Either:
- You haven't purchased this product
- Your order status is still 'pending' (change to 'delivered' to test)
- You already reviewed it

---

## Common Issues & Solutions

### Issue 1: "Failed to submit review. Please try again."
**Check console for specific error**

Common causes:
- Table doesn't exist → Apply migration
- RLS policy blocking → Check you purchased the product
- Order status wrong → Order must be delivered/shipped/processing

### Issue 2: Order ID or Order Item ID is NULL
**Cause**: The review form didn't receive these values

**Fix**: Make sure you:
1. Actually purchased the product
2. Your order status is 'delivered', 'shipped', or 'processing'
3. The `verify_user_purchased_product` function returns data

### Issue 3: Permission Denied (42501 error)
**Cause**: RLS policy is blocking you

**Check**:
- Are you logged in?
- Did you actually purchase this product?
- Is your order delivered/shipped/processing?
- Have you already reviewed this order item?

### Issue 4: Table Not Found (42P01 error)
**Cause**: Migration not applied

**Fix**: Apply the migration (see Step 2)

---

## Quick Test Script

Run this in Supabase SQL Editor to test EVERYTHING:

```sql
-- 1. Check table exists
SELECT 'Table exists:' as check,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_reviews') as result;

-- 2. Check RLS enabled
SELECT 'RLS enabled:' as check,
  relrowsecurity as result
FROM pg_class WHERE relname = 'product_reviews';

-- 3. Check functions exist
SELECT 'Functions exist:' as check,
  COUNT(*) as result
FROM pg_proc
WHERE proname IN (
  'verify_user_purchased_product',
  'get_product_average_rating',
  'get_product_review_count',
  'get_product_rating_distribution'
);
-- Should return: 4

-- 4. Check policies exist
SELECT 'Policies exist:' as check,
  COUNT(*) as result
FROM pg_policies
WHERE tablename = 'product_reviews';
-- Should return: 7 or more
```

---

## What to Send Me

If it still doesn't work, send me:

1. **Screenshot of browser console** showing all the debug logs
2. **Results from Quick Test Script** above
3. **Your User ID** (from console debug log)
4. **The Product ID** you're trying to review
5. **Result from Step 4** (verify you have an order)

With this information, I can tell you EXACTLY what's wrong.
