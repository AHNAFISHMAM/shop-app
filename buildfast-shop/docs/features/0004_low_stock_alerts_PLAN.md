# Feature 0004: Low Stock Alerts (Admin)

## Overview

Implement a Low Stock Alerts system for admins to monitor inventory and get notified when products are running low. Simple approach using database fields and admin dashboard display.

## Requirements

- Admin sets "low stock threshold" per product (e.g., alert when below 10 items)
- Admin Dashboard shows products running low
- Red badge/warning icon on low stock items
- Email to admin when product hits threshold (optional - manual check for now)
- "Out of Stock" auto-applies when quantity hits zero
- Easy restock button to update quantity

## Technical Approach

### Phase 1: Database Schema

**Add to products table:**
- `low_stock_threshold` INTEGER DEFAULT 10 - Threshold for low stock alerts
- Use existing `stock_quantity` field

**No additional tables needed** - Keep it simple!

### Phase 2: Admin Dashboard Component

**Create `src/components/admin/LowStockAlerts.jsx`:**
- Dashboard widget showing low stock products
- Displays products where `stock_quantity <= low_stock_threshold`
- Red warning badges
- Quick restock button
- Professional card layout

### Phase 3: Admin Products Page Enhancement

**Modify `src/pages/admin/AdminProducts.jsx`:**
- Add `low_stock_threshold` field to add/edit product forms
- Show red badge on products with low stock
- Add "Restock" quick action button
- Display current stock vs threshold

### Phase 4: Admin Dashboard Integration

**Modify `src/pages/Admin.jsx`:**
- Add LowStockAlerts widget at top
- Show count of low stock products
- Prominent alert section

## Implementation Details

### Database Migration

```sql
-- Add low_stock_threshold column to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold >= 0);

-- Add index for low stock queries
CREATE INDEX IF NOT EXISTS idx_products_low_stock
ON products(stock_quantity)
WHERE stock_quantity <= low_stock_threshold;
```

### Files to Create

**1. `supabase/migrations/021_add_low_stock_threshold.sql`**
- Migration to add low_stock_threshold column
- Index for performance

**2. `src/components/admin/LowStockAlerts.jsx`**
- Dashboard widget component
- Fetches low stock products
- Displays with red badges
- Quick restock functionality
- Links to product edit page

### Files to Modify

**1. `src/pages/admin/AdminProducts.jsx`**
- Add low_stock_threshold input field in add/edit forms
- Show red badge for products where stock_quantity <= low_stock_threshold
- Add "Restock" button next to low stock products
- Update stock quantity with modal/inline input

**2. `src/pages/Admin.jsx`**
- Import and render LowStockAlerts component
- Place at top of dashboard for visibility
- Show summary stats

## Low Stock Detection Logic

```javascript
// Product is low stock if:
stock_quantity <= low_stock_threshold

// Product is out of stock if:
stock_quantity === 0

// Query for low stock products:
SELECT * FROM products
WHERE stock_quantity <= low_stock_threshold
AND stock_quantity > 0
ORDER BY stock_quantity ASC
```

## UI/UX Design

### LowStockAlerts Component
- **Card header**: "Low Stock Alerts" with count badge
- **Warning icon**: Red triangle with exclamation mark
- **Product list**: Compact rows showing:
  - Product name
  - Current stock (red text)
  - Threshold (gray text)
  - Stock bar (visual indicator)
  - Restock button
- **Empty state**: "All products are well stocked!"

### Red Badges
- **Color**: bg-red-100 text-red-800 border-red-300
- **Icon**: Warning triangle
- **Text**: "Low Stock" or "X items left"

### Restock Button
- **Style**: Small blue button
- **Action**: Opens inline input or modal
- **Updates**: stock_quantity directly
- **Feedback**: Success message after update

## Restock Functionality

### Quick Restock Flow
```
1. Click "Restock" button
2. Modal/inline input appears with:
   - Current stock: X
   - Add quantity: [input]
   - New total: X + input
3. Click "Save"
4. Updates database
5. Shows success message
6. Refreshes product list
```

## Data Flow

```
Admin Dashboard Load
    ↓
Fetch products WHERE stock_quantity <= low_stock_threshold
    ↓
Display in LowStockAlerts widget
    ↓
Admin clicks "Restock"
    ↓
Modal opens with input
    ↓
Admin enters quantity to add
    ↓
Update: stock_quantity = stock_quantity + added_quantity
    ↓
Refresh product data
    ↓
Badge disappears if stock > threshold
```

## Email Notifications (Future Enhancement)

For now: Manual monitoring via dashboard
Future: Supabase Edge Function to send emails when threshold crossed

## Testing Checklist

- [ ] Migration adds low_stock_threshold column
- [ ] Default threshold is 10
- [ ] LowStockAlerts component shows products with stock <= threshold
- [ ] Red badges appear on low stock products
- [ ] Restock button updates stock quantity
- [ ] Badge disappears when stock goes above threshold
- [ ] Out of stock products (0) show special indicator
- [ ] Admin can set custom threshold per product
- [ ] Dashboard shows count of low stock items
- [ ] Mobile responsive
- [ ] Admin-only access (non-admins can't see)

## Edge Cases

1. **Threshold set to 0** - No alerts (valid)
2. **Stock goes negative** - Prevented by CHECK constraint
3. **Threshold higher than initial stock** - Shows alert immediately (valid)
4. **Multiple admins restocking** - Last write wins (acceptable)
5. **Product deleted** - No issue, query just excludes it

## Performance Considerations

- Index on stock_quantity for fast queries
- Dashboard query limited to low stock only (small result set)
- No polling - manual refresh or page load
- Lightweight widget, minimal API calls

## Security

- RLS policies already restrict products table to admins
- No new security concerns
- Restock updates use existing admin policies
