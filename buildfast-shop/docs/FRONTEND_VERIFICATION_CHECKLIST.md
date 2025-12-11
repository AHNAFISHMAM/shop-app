# Star Café Official Menu - Frontend Verification Checklist

## Overview
After running the `060_star_cafe_official_menu_import.sql` migration, verify that all menu data displays correctly on the frontend.

## Quick Verification

### 1. Database Check
```bash
node scripts/verify-and-import-menu.js
```
Expected output:
- ✅ Categories: 24
- ✅ Menu Items: 200+

## Frontend Pages to Test

### A. Menu Page (`/menu`)
**URL**: http://localhost:5180/menu

**Checklist**:
- [ ] Page loads without errors
- [ ] All 24 categories are visible in the category navigation/filter
- [ ] Clicking each category shows its items
- [ ] Items display correct prices in BDT
- [ ] Items have placeholder images
- [ ] Pizza variants show all 3 sizes (8", 10", 12")
- [ ] Portion variants show correctly (1:1, 1:2, 1:3)

**Categories to Verify** (24 total):
1. [ ] SET MENU ON DINE
2. [ ] SET MENU ONLY TAKE AWAY
3. [ ] BIRYANI ITEMS
4. [ ] BANGLA MENU
5. [ ] BEEF
6. [ ] MUTTON
7. [ ] CHICKEN
8. [ ] PRAWN & FISH
9. [ ] KABAB
10. [ ] NAAN
11. [ ] RICE
12. [ ] PIZZA (should show 18 items: 6 pizzas × 3 sizes)
13. [ ] BURGER
14. [ ] SOUP
15. [ ] CHOWMEIN/PASTA/RAMEN
16. [ ] APPETIZERS & SNACKS
17. [ ] NACHOS
18. [ ] SIZZLING
19. [ ] VEGETABLE
20. [ ] SALAD
21. [ ] WRAP
22. [ ] SANDWICH
23. [ ] DESSERTS
24. [ ] BEVERAGE

**Sample Items to Check**:
- [ ] Star Special Kacchi Biryani (Chinigura Rice) with Jali Kabab - 330 BDT (should be featured/signature)
- [ ] Chicken Cheese Pizza 8" - 420 BDT
- [ ] Chicken Cheese Pizza 10" - 580 BDT
- [ ] Chicken Cheese Pizza 12" - 780 BDT
- [ ] Beef Peshawar (1:1) - 330 BDT
- [ ] Beef Peshawar (1:2) - 650 BDT

### B. Order Page (`/order` or `/order-online`)
**URL**: http://localhost:5180/order

**Checklist**:
- [ ] Page loads without errors
- [ ] Category filter/dropdown shows all 24 categories
- [ ] Selecting a category filters items correctly
- [ ] Search functionality works
- [ ] Items can be added to cart
- [ ] Cart icon shows item count
- [ ] Cart displays correct prices
- [ ] Guest checkout flow works

**Test Add-to-Cart**:
1. [ ] Add "Star Special Kacchi Biryani" to cart
2. [ ] Add "Chicken Cheese Pizza 10"" to cart
3. [ ] Add "Beef Peshawar (1:2)" to cart
4. [ ] Verify cart shows all 3 items with correct prices
5. [ ] Verify total calculates correctly (330 + 580 + 650 = 1560 BDT)

### C. Admin Menu Management (`/admin/menu-items`)
**URL**: http://localhost:5180/admin/menu-items

**Checklist** (requires admin login):
- [ ] All 24 categories listed
- [ ] All 200+ menu items visible in table
- [ ] Can edit item details
- [ ] Can mark items as available/unavailable
- [ ] Can mark items as featured
- [ ] Can filter by category
- [ ] Can search items
- [ ] Prices displayed correctly in BDT

### D. Special Sections / Featured Items
**Checklist**:
- [ ] Signature/featured items display on homepage or special section
- [ ] Star Special Kacchi Biryani shows as featured (is_featured = true)
- [ ] Featured items have visual indicator (star icon, badge, etc.)

## Common Issues and Fixes

### Issue: Categories not showing
**Fix**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Items not loading
**Possible causes**:
1. Migration not run successfully
2. RLS policies blocking access
3. Frontend caching old data

**Debug steps**:
```bash
# 1. Verify data in database
node scripts/verify-and-import-menu.js

# 2. Check browser console for errors (F12)

# 3. Clear browser cache and hard refresh
```

### Issue: Prices showing as 0 or undefined
**Fix**: Check that `price` column is populated in the migration

### Issue: Images not showing
**Note**: Migration sets placeholder images. This is expected.
Placeholder format: `/images/categories/{category-slug}.jpg`

## Performance Checks

- [ ] Page loads in under 3 seconds
- [ ] Category switching is instant (< 500ms)
- [ ] Search results appear quickly (< 1s)
- [ ] No console errors or warnings
- [ ] No layout shift when items load

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browser (responsive design)

## Final Verification

After all checks:
```bash
# Run verification script one more time
node scripts/verify-and-import-menu.js

# Expected output:
# ✅ Official menu data appears to be loaded!
#    All categories and items are present.
```

## Checklist Summary

**Database**:
- ✅ 24 categories
- ✅ 200+ menu items
- ✅ All prices in BDT
- ✅ Featured items marked

**Frontend**:
- ✅ Menu page displays all categories
- ✅ Order page allows filtering and adding to cart
- ✅ Admin panel shows all items
- ✅ No console errors
- ✅ Responsive design works

**Functionality**:
- ✅ Add to cart works
- ✅ Category filtering works
- ✅ Search works
- ✅ Guest checkout works

---

**Status**: Ready for Phase 3 verification once migration is complete
