# Star Café Menu System - Setup Checklist

Use this checklist to track your setup progress!

---

## ☐ Phase 1: Database Setup (5 minutes)

### Run Migrations
- [ ] Open Supabase Dashboard (https://supabase.com/dashboard)
- [ ] Go to SQL Editor
- [ ] Click "New Query"
- [ ] Copy contents of `supabase/migrations/MANUAL_star_cafe_menu_complete.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" ▶️
- [ ] Wait for success message ✅
- [ ] Click "New Query" again
- [ ] Copy contents of `supabase/migrations/COMPLETE_STAR_CAFE_SEED.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" ▶️
- [ ] See success message with stats (20 categories, 150+ items) ✅

### Verify Database
- [ ] Run: `SELECT COUNT(*) FROM menu_categories;` → Should return **20**
- [ ] Run: `SELECT COUNT(*) FROM menu_items;` → Should return **150+**
- [ ] Run: `SELECT * FROM menu_items LIMIT 5;` → Should show dish data

---

## ☐ Phase 2: Test Public Menu (2 minutes)

### Visit Menu Page
- [ ] Go to: http://localhost:5173/menu
- [ ] See 20 category buttons at top
- [ ] See Chef's Picks section (if any items marked featured)
- [ ] See menu items displayed in grid
- [ ] Click a category → Items should filter
- [ ] Use search bar → Type "chicken" and see results
- [ ] Click "Add to Cart" on an item → Cart counter should increase
- [ ] See placeholder images (gold gradient with dish names)

---

## ☐ Phase 3: Test Admin Panel (5 minutes)

### Login as Admin
- [ ] Make sure you're logged in as admin
- [ ] Check that your account has `role: 'admin'` in Supabase

### Test Menu Categories
- [ ] Visit: http://localhost:5173/admin/menu-categories
- [ ] See list of 20 categories
- [ ] Click "Add New Category" → Create a test category
- [ ] Edit an existing category → Change name or description
- [ ] Try reordering → Use ↑ ↓ buttons
- [ ] Delete your test category

### Test Menu Items
- [ ] Visit: http://localhost:5173/admin/menu-items
- [ ] See grid of 150+ menu items
- [ ] Use category filter dropdown → Filter by "Biryani"
- [ ] Use search → Type "chicken"
- [ ] Click "Add New Item" → Create a test dish
- [ ] Edit an existing item → Click "Edit" button
- [ ] Delete your test dish

---

## ☐ Phase 4: Image Management (10 minutes)

### Single Image Upload
- [ ] In `/admin/menu-items`, click any item's image area
- [ ] See "Change Image" button on hover
- [ ] Click to open upload modal
- [ ] Drag-drop a food image OR click "Browse Files"
- [ ] See image preview
- [ ] Click "Upload Image"
- [ ] See success toast notification ✅
- [ ] Image should display on the card

### Bulk Image Upload (Optional)
- [ ] Click "📸 Bulk Image Upload" button
- [ ] Drag-drop 3-5 food images
- [ ] See list of uploaded files
- [ ] Check "Auto-Matched" section → System tries to match by filename
- [ ] Check "Manual Assignment Required" → Manually assign using dropdown
- [ ] Click "Apply X Assignment(s)"
- [ ] See images updated on item cards

### Direct URL Method (Optional)
- [ ] Edit any menu item
- [ ] Scroll to "Image URL" field
- [ ] Paste an image URL (e.g., from Unsplash)
- [ ] Click "Update Item"
- [ ] Image should display

---

## ☐ Phase 5: Cart & Ordering (3 minutes)

### Test Cart Functionality
- [ ] On `/menu` page, add 3-4 different items to cart
- [ ] See cart counter increase with each add
- [ ] Click floating cart button (bottom right)
- [ ] See cart items listed
- [ ] Try updating quantity (+/- buttons)
- [ ] Try removing an item
- [ ] Cart should update in real-time

### Test Order Page (If implemented)
- [ ] Visit: http://localhost:5173/order
- [ ] See menu items available
- [ ] Cart sidebar should show your items (desktop)
- [ ] Cart bottom sheet should work (mobile)
- [ ] Add more items from order page
- [ ] Proceed to checkout (if that flow exists)

---

## ☐ Phase 6: Feature Testing (5 minutes)

### Test Special Features
- [ ] Mark an item as "Chef's Pick" (featured) in admin
- [ ] Go to `/menu` → See it in Chef's Picks section
- [ ] Set dietary tags on an item → See badges display
- [ ] Set spice level 🌶️ → See chili emojis
- [ ] Toggle item availability to "Unavailable"
- [ ] Go to `/menu` → Item should not appear
- [ ] Toggle back to "Available" → Item reappears

### Test Filters & Search
- [ ] Use category filters → Verify items filter correctly
- [ ] Search for partial terms → "beef", "rice", "pizza"
- [ ] Try empty search → Should show all items
- [ ] Click "Clear Filters" → Should reset

---

## ☐ Phase 7: Mobile Testing (3 minutes)

### Responsive Design
- [ ] Open browser dev tools (F12)
- [ ] Switch to mobile view (375px width)
- [ ] Visit `/menu` → Categories should scroll horizontally
- [ ] Grid should show 1 column
- [ ] Cart button should be fixed at bottom
- [ ] Visit `/admin/menu-items` → Should be usable on mobile
- [ ] Image upload should work on mobile

---

## ☐ Phase 8: Production Checks (5 minutes)

### Performance
- [ ] Check page load time on `/menu`
- [ ] Scroll through 150+ items → Should be smooth
- [ ] Image loading → Check lazy loading works
- [ ] Cart updates → Should be instant (no lag)

### Security
- [ ] Log out → Visit `/admin/menu-items` → Should redirect
- [ ] Try accessing `/menu` as guest → Should work
- [ ] Try adding to cart as guest → Should work (localStorage)
- [ ] Log back in → Guest cart should persist

### Data Integrity
- [ ] Add item to cart → Refresh page → Cart should persist
- [ ] Edit menu item in admin → Changes should appear immediately on `/menu`
- [ ] Delete an item → Should disappear from menu
- [ ] Categories should maintain sort order

---

## ✅ Setup Complete!

When you've checked all boxes above:
- ✅ Database is set up with 150+ dishes
- ✅ Public menu is functional
- ✅ Admin panel is working
- ✅ Images can be uploaded
- ✅ Cart is operational
- ✅ Everything is tested

---

## 🎯 Optional Next Steps

After completing the checklist:
- [ ] Upload real dish photos (via bulk upload)
- [ ] Customize Chef's Picks selection
- [ ] Set Today's Menu items
- [ ] Configure special section flags
- [ ] Adjust spice levels for accuracy
- [ ] Add dietary tags to all vegetarian items
- [ ] Set prep times for all dishes
- [ ] Create promotional menu sections
- [ ] Test order completion flow
- [ ] Set up email notifications (if enabled)

---

## 📋 Troubleshooting Quick Reference

**Issue**: Menu page is empty
→ **Fix**: Run the seed script `COMPLETE_STAR_CAFE_SEED.sql`

**Issue**: Can't access admin pages
→ **Fix**: Verify admin role in Supabase (`raw_user_meta_data->>'role' = 'admin'`)

**Issue**: Images not uploading
→ **Fix**: Check Supabase Storage "product-images" bucket exists and has public access

**Issue**: Cart not working
→ **Fix**: Clear localStorage, refresh page, try again

**Issue**: Items not filtering
→ **Fix**: Check that `category_id` matches between items and categories

---

## 📞 Need Help?

- **Setup Guide**: See `STAR_CAFE_MENU_SETUP.md`
- **Complete Summary**: See `IMPLEMENTATION_COMPLETE.md`
- **Code Review**: See `docs/features/_STAR_CAFE_MENU_REVIEW.md`

---

**Happy testing! 🎉**

*Mark items as you complete them to track progress.*
