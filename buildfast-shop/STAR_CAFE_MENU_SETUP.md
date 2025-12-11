# 🎯 Star Café Menu System - Complete Setup Guide

## ✅ What Has Been Completed

All code has been implemented and is ready to use:
- ✅ Database schema designed
- ✅ Migration scripts created
- ✅ Admin management pages built
- ✅ Public menu page updated
- ✅ Cart integration completed
- ✅ Image management system implemented
- ✅ 150+ Star Café dishes prepared for seeding

**You just need to run the database migrations!**

---

## 🚀 Quick Start (3 Steps)

### Step 1: Run Database Migrations

**Via Supabase Dashboard** (Recommended):

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of: `supabase/migrations/MANUAL_star_cafe_menu_complete.sql`
5. Click **Run** (bottom right)
6. Wait for success message ✅
7. Create another new query
8. Copy and paste the contents of: `supabase/migrations/COMPLETE_STAR_CAFE_SEED.sql`
9. Click **Run**
10. You should see: "✅ COMPLETE STAR CAFÉ MENU SEEDED!" with stats

**Expected Output:**
```
========================================
✅ COMPLETE STAR CAFÉ MENU SEEDED!
========================================
📊 Total Categories: 20
🍽️  Total Menu Items: 150+
⭐ Featured Items: 5
🌶️  Spicy Items: 60+
🥗 Vegetarian Items: 30+
========================================
```

### Step 2: Verify Setup

Visit these URLs to confirm everything works:

**Public Menu:**
- http://localhost:5173/menu - Should show categories and menu items

**Admin Panel:**
- http://localhost:5173/admin/menu-categories - Should show 20 categories
- http://localhost:5173/admin/menu-items - Should show 150+ menu items

### Step 3: Upload Images (Optional)

You have 3 options:

**Option A: Via Admin UI (Easy)**
1. Login as admin
2. Go to `/admin/menu-items`
3. Click any item's image area
4. Upload image via drag-drop

**Option B: Bulk Upload (Faster)**
1. Login as admin
2. Go to `/admin/menu-items`
3. Click "📸 Bulk Image Upload"
4. Upload multiple images
5. System auto-matches by filename

**Option C: Manual Files**
1. Add images to `public/images/menu/`
2. Name them like: `kacchi-biryani.webp`
3. They'll automatically be accessible

**Don't have images?** No problem! The system generates beautiful placeholder images automatically with dish names and gold gradient backgrounds.

---

## 📁 File Structure

```
buildfast-shop/
├── supabase/migrations/
│   ├── MANUAL_star_cafe_menu_complete.sql  ← Run this FIRST
│   ├── COMPLETE_STAR_CAFE_SEED.sql         ← Run this SECOND
│   ├── 050_star_cafe_menu_system.sql       (backup)
│   └── 051_add_menu_item_id_to_cart.sql    (backup)
│
├── src/
│   ├── lib/
│   │   ├── imageUtils.js                   ← Image upload utilities
│   │   └── cartUtils.js                    ← Cart functions (updated)
│   │
│   ├── pages/
│   │   ├── MenuPage.jsx                    ← Public menu (updated)
│   │   └── admin/
│   │       ├── AdminMenuCategories.jsx     ← NEW
│   │       └── AdminMenuItems.jsx          ← NEW
│   │
│   ├── components/admin/
│   │   ├── ImageUploadModal.jsx            ← NEW
│   │   └── BulkImageAssignment.jsx         ← NEW
│   │
│   └── App.jsx                             ← Routes added
│
├── public/images/menu/
│   └── README.md                           ← Image guidelines
│
└── docs/features/
    └── _STAR_CAFE_MENU_REVIEW.md           ← Complete code review
```

---

## 🗄️ Database Schema

### Tables Created

**1. menu_categories**
```sql
- id (UUID, PK)
- name (TEXT, UNIQUE) - e.g., "Biryani Items"
- slug (TEXT, UNIQUE) - e.g., "biryani"
- description (TEXT)
- sort_order (INTEGER)
- created_at (TIMESTAMPTZ)
```

**2. menu_items**
```sql
- id (UUID, PK)
- category_id (UUID, FK)
- name, description (TEXT)
- price (NUMERIC), currency (TEXT default 'BDT')
- image_url, placeholder_color (TEXT)
- is_available, is_featured (BOOLEAN)
- Special section flags (6 booleans)
- dietary_tags (TEXT[]) - e.g., ['vegetarian', 'vegan']
- spice_level (INTEGER 0-3)
- prep_time (INTEGER)
- created_at, updated_at (TIMESTAMPTZ)
```

**3. cart_items (Enhanced)**
```sql
- menu_item_id (UUID, nullable) - NEW!
- product_id (UUID, nullable) - OLD (preserved)
- CHECK: must have either product_id OR menu_item_id
```

### Security (RLS Policies)
- ✅ Public can read available categories & items
- ✅ Admins have full access to manage everything

---

## 🎨 Admin Features

### Menu Categories Management (`/admin/menu-categories`)
- ✅ Add/Edit/Delete categories
- ✅ Reorder with up/down buttons
- ✅ Auto-generate URL-friendly slugs
- ✅ Set descriptions

### Menu Items Management (`/admin/menu-items`)
- ✅ Full CRUD operations
- ✅ Filter by category
- ✅ Search by name/description
- ✅ **Powerful Image Management**:
  - Individual upload (drag-drop)
  - Bulk upload with auto-matching
  - Direct URL editing
  - Placeholder generation
  - Preview on hover
- ✅ Toggle availability
- ✅ Mark as Chef's Pick (featured)
- ✅ Set special section flags
- ✅ Edit dietary tags, spice level, prep time
- ✅ Real-time updates with toast notifications

---

## 🌐 Public Features

### Menu Page (`/menu`)
- ✅ Clean category navigation
- ✅ Chef's Picks section (featured items)
- ✅ Search functionality
- ✅ Filter by category
- ✅ Add to cart
- ✅ Real-time cart counter
- ✅ Dark luxe aesthetic (#050509 + #C59D5F gold)

### Features Preserved
- ✅ Special sections (Today's Menu, Daily Specials, etc.)
- ✅ Dietary tags (vegetarian, vegan, gluten-free, etc.)
- ✅ Spice level indicators (🌶️🌶️🌶️)
- ✅ Prep time display
- ✅ Cart integration (authenticated + guest)
- ✅ Backward compatibility with old orders

---

## 🧪 Testing Checklist

After running migrations, test these:

### Database
- [ ] `SELECT COUNT(*) FROM menu_categories;` → Should return 20
- [ ] `SELECT COUNT(*) FROM menu_items;` → Should return 150+
- [ ] `SELECT COUNT(*) FROM menu_items WHERE is_featured = true;` → Should return ~5

### Admin Panel
- [ ] Login as admin
- [ ] Visit `/admin/menu-categories` → See 20 categories
- [ ] Click "Add New Category" → Create a test category
- [ ] Reorder a category → Use up/down buttons
- [ ] Visit `/admin/menu-items` → See 150+ items
- [ ] Click "Add New Item" → Create a test dish
- [ ] Upload an image → Drag-drop a food photo
- [ ] Click "Bulk Image Upload" → Try bulk upload
- [ ] Toggle availability → Click available/unavailable button
- [ ] Mark as Chef's Pick → Toggle featured checkbox

### Public Menu
- [ ] Visit `/menu` → See categories and dishes
- [ ] Click a category → Should filter items
- [ ] Search for "chicken" → Should show chicken dishes
- [ ] Check Chef's Picks section → Should show featured items
- [ ] Click "Add to Cart" → Cart counter should increase
- [ ] Check cart icon → Should show item count

### Cart
- [ ] Add items to cart
- [ ] Visit `/order` → Should show cart with menu items
- [ ] Update quantity → Use +/- buttons
- [ ] Remove item → Should work

---

## 🔧 Troubleshooting

### Migration Fails
**Problem**: SQL error when running migrations

**Solutions**:
1. Make sure you're running `MANUAL_star_cafe_menu_complete.sql` **first**
2. Check that you have admin permissions in Supabase
3. Try running each section separately if needed

### No Items Showing
**Problem**: Menu page is empty

**Solutions**:
1. Check that seed script ran successfully
2. Run in SQL Editor: `SELECT * FROM menu_items LIMIT 5;`
3. Verify RLS policies are set up correctly

### Images Not Displaying
**Problem**: Placeholder or broken images

**Solutions**:
1. This is normal if you haven't uploaded images yet
2. System will show placeholders with dish names
3. Upload images via admin panel when ready
4. Or add image files to `public/images/menu/`

### Cart Not Working
**Problem**: Items not adding to cart

**Solutions**:
1. Check browser console for errors
2. Verify `menu_item_id` column exists in `cart_items`
3. Run: `SELECT * FROM cart_items LIMIT 5;`
4. Clear browser localStorage and try again

---

## 📊 Menu Data Summary

### 20 Categories
1. Set Menu (Dine In) - 4 items
2. Set Menu (Take Away) - 3 items
3. Biryani Items - 7 items
4. Bangla Menu - 8 items
5. Beef - 10 items
6. Mutton - 9 items
7. Chicken - 15 items
8. Prawn & Fish - 13 items
9. Kabab - 11 items
10. Naan - 7 items
11. Rice - 9 items
12. Pizza - 12 items
13. Burger - 7 items
14. Soup - 7 items
15. Chowmein/Pasta/Ramen - 10 items
16. Appetizers & Snacks - 10 items
17. Nachos - 4 items
18. Sizzling - 5 items
19. Vegetable - 8 items
20. Salad - 6 items

**Total: 150+ authentic Star Café dishes!**

---

## 🎯 Next Steps After Setup

1. **Upload Images**
   - Use admin panel bulk upload feature
   - Or add files to `public/images/menu/`

2. **Customize Items**
   - Mark signature dishes as "Chef's Pick"
   - Set Today's Menu items
   - Configure spice levels
   - Add dietary tags

3. **Test Ordering Flow**
   - Add items to cart
   - Test checkout process
   - Verify order confirmation

4. **Optional Enhancements**
   - Add more dishes via admin panel
   - Create seasonal menu sections
   - Set up discount codes
   - Configure delivery settings

---

## 📞 Support

**Documentation**:
- Code Review: `docs/features/_STAR_CAFE_MENU_REVIEW.md`
- Image Guide: `public/images/menu/README.md`

**Common Tasks**:
- Add menu item: `/admin/menu-items` → "Add New Item"
- Upload images: `/admin/menu-items` → Click item → "Change Image"
- Reorder categories: `/admin/menu-categories` → Use ↑↓ buttons
- Mark featured: `/admin/menu-items` → Toggle "Chef's Pick"

---

## ✅ Success Indicators

You'll know everything is working when:
- ✅ Menu page shows 20 categories
- ✅ Menu page shows 150+ dishes
- ✅ Chef's Picks section appears
- ✅ Add to cart works
- ✅ Admin can manage items
- ✅ Images upload successfully (or placeholders show)
- ✅ Cart shows correct items
- ✅ Dark luxe design throughout

---

**That's it! Your Star Café menu system is ready to go!** 🎉

Run the two SQL scripts and start using your restaurant menu management system.
