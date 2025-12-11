# Feature 0003: Recently Viewed Products

## Overview

Implement a "Recently Viewed Products" feature that tracks products customers view and displays them at the bottom of the homepage. Uses browser localStorage for persistence, works for both logged-in and guest users.

## Requirements

- Tracks products customer views
- "Recently Viewed" section at the bottom of the homepage
- Shows last 10-15 products viewed
- Links back to product pages
- Clears when customer logs out (optional)
- Shows even if not logged in (uses browser storage)

## Technical Approach

### Data Storage
- Use **localStorage** to store recently viewed products
- Store array of product IDs with timestamps: `[{productId, timestamp}, ...]`
- No database tables needed (browser-based tracking)
- Maximum 15 products stored, oldest removed first

### Files to Create

**1. `src/lib/recentlyViewedUtils.js`**
- `addToRecentlyViewed(productId)` - Add product to recently viewed list
- `getRecentlyViewed()` - Get list of recently viewed product IDs
- `clearRecentlyViewed()` - Clear the list (for logout)
- Uses localStorage key: `recently_viewed_products`
- Maintains max 15 products, removes oldest when exceeded

**2. `src/components/RecentlyViewed.jsx`**
- Component to display recently viewed products
- Fetches product data from Supabase using product IDs from localStorage
- Shows product cards in horizontal scrollable layout
- Links to product detail pages
- Shows "Recently Viewed" heading
- Empty state when no products viewed
- Responsive design (horizontal scroll on mobile, grid on desktop)

### Files to Modify

**1. `src/pages/ProductDetail.jsx`**
- Import and call `addToRecentlyViewed(productId)` when product page loads
- Add in useEffect after product data is loaded
- Track view regardless of user authentication status

**2. `src/pages/Home.jsx`**
- Import and render `RecentlyViewed` component
- Place at bottom of homepage (after featured products/categories)
- Only show if there are recently viewed products

**3. `src/contexts/AuthContext.jsx` (optional)**
- Add `clearRecentlyViewed()` call in `signOut()` function
- Clears recently viewed when user logs out

## Implementation Logic

### Adding to Recently Viewed
```
1. Get current list from localStorage
2. Check if product already exists in list
3. If exists, move to front (update timestamp)
4. If not exists, add to front
5. Keep only first 15 items
6. Save back to localStorage
```

### Displaying Recently Viewed
```
1. Get product IDs from localStorage
2. Fetch product data from Supabase (batch query)
3. Display products in horizontal scroll/grid
4. Handle missing products (deleted from database)
5. Show empty state if no products
```

## UI/UX Design

### RecentlyViewed Component
- Section heading: "Recently Viewed"
- Horizontal scrollable row on mobile
- Grid layout on desktop (4-5 columns)
- Product cards show:
  - Product image
  - Product name
  - Product price
  - Link to product detail page
- Smooth scroll behavior
- No "Add to cart" button (keep simple)

### Styling
- Match existing product card styling
- Similar to Products page cards
- Responsive and mobile-friendly
- Clean and professional appearance

## Data Flow

```
ProductDetail Page Load
    ↓
addToRecentlyViewed(productId)
    ↓
localStorage update
    ↓
Homepage visits
    ↓
RecentlyViewed component reads localStorage
    ↓
Fetches product data from Supabase
    ↓
Displays product cards
```

## Edge Cases

1. **Deleted products** - Filter out products that no longer exist in database
2. **No products viewed** - Show nothing (don't render component)
3. **localStorage disabled** - Fail gracefully, don't break the app
4. **Corrupted data** - Catch errors, reset localStorage if needed
5. **Same product viewed multiple times** - Move to front, don't duplicate

## Testing Checklist

- [ ] View a product, it appears in recently viewed
- [ ] View 20 products, only last 15 are kept
- [ ] View same product twice, it moves to front (no duplicate)
- [ ] Recently viewed persists after page refresh
- [ ] Recently viewed works for guest users
- [ ] Recently viewed works for logged-in users
- [ ] Logout clears recently viewed (optional)
- [ ] Component renders on homepage
- [ ] Clicking product card goes to correct product page
- [ ] Mobile responsive (horizontal scroll)
- [ ] Desktop grid layout works
- [ ] Empty state (no products viewed) doesn't show component
