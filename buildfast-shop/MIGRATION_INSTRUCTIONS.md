# Star Café Official Menu Import - Manual Migration Instructions

## Current Status

✅ **Migration file created**: `supabase/migrations/060_star_cafe_official_menu_import.sql`

📊 **Current Database State**:
- Categories: 20 (Expected: 24)
- Menu Items: 178 (Expected: 200+)

## How to Run the Migration Manually

### Method 1: Supabase Dashboard SQL Editor (Recommended)

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/shgwzqhwoamcvruztfuz/sql/new

2. **Copy the Migration SQL**:
   - Open the file: `supabase/migrations/060_star_cafe_official_menu_import.sql`
   - Copy all the content (Ctrl+A, Ctrl+C)

3. **Run in SQL Editor**:
   - Paste the SQL into the SQL Editor
   - Click "Run" button (bottom right)
   - Wait for completion (should take 10-30 seconds)

4. **Verify Success**:
   - You should see messages indicating successful import
   - Check that no errors appeared

### Method 2: Supabase CLI (Alternative)

If your database connection is stable, you can try:

```bash
cd buildfast-shop
npx supabase db push --include-all
```

## What the Migration Does

1. ✅ Clears existing sample menu data
2. ✅ Imports 24 official categories with exact names
3. ✅ Imports 200+ menu items with exact prices in BDT
4. ✅ Handles pizza variants (6 pizzas × 3 sizes = 18 items)
5. ✅ Handles portion sizes (1:1, 1:2, 1:3 variants)
6. ✅ Marks signature items as featured
7. ✅ Sets placeholder images using category slugs

## Expected Results After Migration

**Categories (24 total)**:
- SET MENU ON DINE
- SET MENU ONLY TAKE AWAY
- BIRYANI ITEMS
- BANGLA MENU
- BEEF
- MUTTON
- CHICKEN
- PRAWN & FISH
- KABAB
- NAAN
- RICE
- PIZZA
- BURGER
- SOUP
- CHOWMEIN/PASTA/RAMEN
- APPETIZERS & SNACKS
- NACHOS
- SIZZLING
- VEGETABLE
- SALAD
- WRAP
- SANDWICH
- DESSERTS
- BEVERAGE

**Menu Items**: 200+ items with exact prices from official menu

## Verification

After running the migration, verify using:

```bash
node scripts/verify-and-import-menu.js
```

You should see:
- ✅ Categories: 24
- ✅ Menu Items: 200+

## Next Steps

After successful migration:
1. ✅ Test frontend display at http://localhost:5180/menu
2. ✅ Test category filtering
3. ✅ Test add-to-cart functionality
4. ✅ Verify special sections display correctly
5. ✅ Check admin panel menu management

---

**Need Help?** If you encounter any errors, check:
- Supabase project is active (not paused)
- You're logged into the correct Supabase account
- The migration file exists and is readable
