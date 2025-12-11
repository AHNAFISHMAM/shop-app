# Star Café Menu - Manual Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing all features of the Star Café menu system after the official menu data import.

## Prerequisites
- ✅ Migration `060_star_cafe_official_menu_import.sql` completed
- ✅ Frontend verification tests passed (all 7 tests)
- ✅ App running on http://localhost:5180

## Test Results Summary

### Automated Tests (✅ All Passed)
```
✓ Test 1: Menu Categories - 30 categories loaded
✓ Test 2: Menu Items - 203 items loaded
✓ Test 3: Category Joins - Working correctly
✓ Test 4: Pizza Variants - 18 variants found (8", 10", 12")
✓ Test 5: Portion Variants - None found (acceptable)
✓ Test 6: Signature Item - Star Special Kacchi Biryani featured
✓ Test 7: Price Validation - All prices valid in BDT
```

## Manual Testing Checklist

### 1. Menu Page (`/menu`)

**Access**: http://localhost:5180/menu

**Category Display**:
- [ ] All categories visible in navigation/sidebar
- [ ] Categories organized by sort order
- [ ] Category names match official menu

**Key Categories to Verify**:
```
✓ SET MENU ON DINE (4 items)
✓ SET MENU ONLY TAKE AWAY (3 items)
✓ BIRYANI ITEMS (7 items)
✓ Pizza (20 items including variants)
✓ BEEF (7 items)
✓ CHICKEN (13 items)
✓ APPETIZERS/SNACKS (22 items)
✓ SOUP (13 items)
```

**Item Display**:
- [ ] Items show name, description, price
- [ ] Prices displayed in BDT
- [ ] Placeholder images show correctly
- [ ] Featured items have visual indicator (star/badge)

**Filtering**:
- [ ] Click each category → only that category's items show
- [ ] Search bar filters items by name
- [ ] "Show All" returns to full menu

**Sample Items to Verify**:
```
✓ Star Special Kacchi Biryani - 330 BDT (Featured)
✓ BBQ Chicken Pizza 8" - 450 BDT
✓ BBQ Chicken Pizza 10" - 650 BDT
✓ BBQ Chicken Pizza 12" - 880 BDT
✓ Package 01 (Dine) - 450 BDT
```

---

### 2. Order Page (`/order` or `/order-online`)

**Access**: http://localhost:5180/order

**Category Filter**:
- [ ] Dropdown shows all 30 categories
- [ ] Selecting category filters items correctly
- [ ] "All Categories" shows all items
- [ ] Category names display correctly

**Search Functionality**:
- [ ] Search bar filters items in real-time
- [ ] Search works across item names and descriptions
- [ ] Clear search returns full list

**Sort Functionality**:
- [ ] Sort by newest works
- [ ] Sort by price (low to high) works
- [ ] Sort by price (high to low) works
- [ ] Sort by name (A-Z) works

**Add to Cart**:
- [ ] Click "Add to Cart" on any item
- [ ] Cart icon shows item count
- [ ] Can add multiple items
- [ ] Can add same item multiple times
- [ ] Cart total calculates correctly

**Test Add-to-Cart Flow**:
```
1. Add "Star Special Kacchi Biryani" (330 BDT)
2. Add "BBQ Chicken Pizza 10"" (650 BDT)
3. Add "Package 01 (Dine)" (450 BDT)

Expected Total: 1,430 BDT
```

**Cart Sidebar/Sheet**:
- [ ] Cart opens when clicking cart icon
- [ ] Shows all added items
- [ ] Shows quantities correctly
- [ ] Can increase/decrease quantities
- [ ] Can remove items
- [ ] Subtotal calculates correctly
- [ ] "Checkout" button present

**Guest Cart**:
- [ ] Can add items without login
- [ ] Cart persists in localStorage
- [ ] Cart survives page refresh
- [ ] Clicking "Order History" shows signup modal

---

### 3. Admin Menu Management (`/admin/menu-items`)

**Access**: http://localhost:5180/admin/menu-items (requires admin login)

**Prerequisites**:
- Admin account created
- Logged in as admin

**Category Management**:
- [ ] All 30 categories listed
- [ ] Can view items per category
- [ ] Can filter by category
- [ ] Category sort order correct

**Menu Item Display**:
- [ ] All 203 items visible in table
- [ ] Columns: Name, Category, Price, Status, Actions
- [ ] Pagination works (if implemented)
- [ ] Search filters items

**Item Management**:
- [ ] Click "Edit" on any item
- [ ] Can modify name, description, price
- [ ] Can toggle availability (is_available)
- [ ] Can toggle featured status (is_featured)
- [ ] Changes save correctly
- [ ] Changes reflect immediately on frontend

**Add New Item**:
- [ ] "Add Item" button present
- [ ] Can create new menu item
- [ ] Can select category
- [ ] Can set price in BDT
- [ ] Can upload image (or set placeholder)
- [ ] New item appears in menu immediately

**Delete Item**:
- [ ] Can delete items
- [ ] Confirmation dialog appears
- [ ] Item removed from frontend
- [ ] Cannot delete items in active orders (if applicable)

---

### 4. Special Sections / Featured Items

**Chef's Picks / Signature Items**:
- [ ] Featured items display prominently
- [ ] "Star Special Kacchi Biryani" shown as featured
- [ ] Featured badge/icon visible
- [ ] At least 5 featured items total

**Special Sections (if configured)**:
- [ ] Today's Menu section
- [ ] Daily Specials section
- [ ] New Dishes section
- [ ] Limited-Time Offers section

---

### 5. Pizza Variants Testing

**Verify All Size Variants**:

Test each pizza in 3 sizes (8", 10", 12"):

```
✓ Chicken Cheese Pizza - 420, 580, 780 BDT
✓ BBQ Chicken Pizza - 450, 650, 880 BDT
✓ Mexican Pizza - 450, 650, 880 BDT
✓ Beef Lover Pizza - 450, 650, 880 BDT
✓ Vegetarian Pizza - 380, 530, 730 BDT
✓ Special Gourmet Pizza - 650, 880, 1200 BDT
```

**Checklist**:
- [ ] Each size shows as separate item
- [ ] Prices correct for each size
- [ ] Can add different sizes to cart
- [ ] Cart shows size in item name
- [ ] All 18 pizza variants present

---

### 6. Price Validation

**Currency Display**:
- [ ] All prices show "BDT" or "৳" symbol
- [ ] Prices formatted correctly (e.g., 330, not 330.00)
- [ ] No $0 or undefined prices

**Price Ranges**:
```
✓ Appetizers: 150-400 BDT
✓ Main Courses: 300-800 BDT
✓ Pizzas: 380-1200 BDT
✓ Biryani: 280-450 BDT
✓ Beverages: 50-200 BDT
```

---

### 7. Responsive Design

**Desktop (1920x1080)**:
- [ ] Grid layout shows 3-4 items per row
- [ ] Categories sidebar visible
- [ ] Cart sidebar slides in from right
- [ ] All text readable

**Tablet (768x1024)**:
- [ ] Grid layout shows 2 items per row
- [ ] Categories collapse to dropdown
- [ ] Cart opens as modal/sheet
- [ ] Navigation responsive

**Mobile (375x667)**:
- [ ] Grid shows 1 item per row
- [ ] Category filter as dropdown
- [ ] Cart as bottom sheet
- [ ] Hamburger menu works
- [ ] Touch targets large enough

---

### 8. Performance Testing

**Page Load**:
- [ ] Menu page loads in under 3 seconds
- [ ] Order page loads in under 3 seconds
- [ ] No visible layout shift
- [ ] Images load progressively

**Interactions**:
- [ ] Category switching instant (< 500ms)
- [ ] Search results appear quickly (< 1s)
- [ ] Add-to-cart feedback immediate
- [ ] Cart updates smoothly

**Real-time Updates** (if admin panel open):
- [ ] Edit item in admin → changes show in menu immediately
- [ ] Toggle availability → item appears/disappears in menu
- [ ] Add new item → appears in menu instantly

---

### 9. Browser Compatibility

**Chrome/Edge** (latest):
- [ ] All features work
- [ ] Styling correct
- [ ] No console errors

**Firefox** (latest):
- [ ] All features work
- [ ] Styling correct
- [ ] No console errors

**Safari** (latest):
- [ ] All features work
- [ ] Styling correct
- [ ] No console errors

**Mobile Safari (iOS)**:
- [ ] Touch interactions work
- [ ] Cart bottom sheet smooth
- [ ] No zoom issues

---

### 10. Error Handling

**Network Errors**:
- [ ] Offline: Shows error message
- [ ] Slow connection: Shows loading state
- [ ] Failed fetch: Shows retry option

**User Errors**:
- [ ] Empty cart checkout: Shows message
- [ ] Invalid search: Shows "No results"
- [ ] Unavailable item: Grayed out / hidden

---

## Common Issues and Fixes

### Issue: Categories not showing all items
**Fix**: Hard refresh browser (Ctrl+Shift+R)

### Issue: Prices showing as 0
**Check**: Migration ran successfully, verify with:
```bash
node scripts/verify-and-import-menu.js
```

### Issue: Cart not updating
**Fix**:
1. Check browser console for errors
2. Clear localStorage: `localStorage.clear()`
3. Refresh page

### Issue: Images not loading
**Note**: Placeholder images expected. Format: `/images/categories/{slug}.jpg`

---

## Final Verification

After completing all tests above, run:

```bash
# Verify database state
node scripts/verify-and-import-menu.js

# Run frontend tests
node scripts/frontend-verification-test.js
```

Both should show ✅ ALL TESTS PASSED.

---

## Test Completion Checklist

- [ ] All automated tests passed
- [ ] Menu page displays correctly
- [ ] Order page functional
- [ ] Admin panel working
- [ ] Cart operations successful
- [ ] Pizza variants verified
- [ ] Prices validated
- [ ] Responsive design tested
- [ ] Performance acceptable
- [ ] Browser compatibility confirmed

---

## Next Steps

If all tests pass:
1. ✅ Document any issues found
2. ✅ Create production deployment plan
3. ✅ Prepare user training materials
4. ✅ Set up monitoring and analytics

---

**Testing Completed**: ________________ (Date)

**Tested By**: ________________

**Status**: [ ] PASS [ ] FAIL (with notes below)

**Notes**:
