# Feature #0010: Store Settings

## Description
Admin interface to configure important store details including store name, description, logo, tax rate, shipping costs, currency, store hours/contact info, social media links, and return policy. All settings are saved and applied automatically across the store.

## Phase 1: Data Layer

### Database Schema

Create `store_settings` table:
```sql
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Buildfast Shop',
  store_description TEXT,
  store_logo_url TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 0.00,
  shipping_type TEXT DEFAULT 'flat' CHECK (shipping_type IN ('flat', 'free_over_amount', 'free')),
  shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
  free_shipping_threshold DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  store_hours TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  return_policy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies
- Admin users can view, insert, update store settings
- Public users can view store settings (for display on frontend)
- Ensure only one settings row exists (singleton pattern)

### Files to Create/Modify
- `supabase/migrations/022_create_store_settings_table.sql` - Create table and policies

## Phase 2: Backend Integration

### Files to Modify
- Create utility functions to fetch store settings with caching
- Update checkout flow to use tax_rate from settings
- Update shipping calculation to use shipping settings

### Files
- `src/lib/storeSettings.js` - Utility functions for fetching/updating store settings
- `src/contexts/StoreSettingsContext.jsx` - Context provider for store-wide settings
- `src/pages/Checkout.jsx` - Use tax rate and shipping from settings

## Phase 3: Admin UI

### Create Admin Settings Page
File: `src/pages/admin/AdminSettings.jsx`

Features:
1. **Store Information Section**
   - Store name input (text)
   - Store description textarea
   - Store logo upload (URL input for now, can be enhanced with file upload later)

2. **Tax & Shipping Section**
   - Tax rate input (percentage, e.g., 8.5 for 8.5%)
   - Shipping type selector (flat rate, free over X amount, always free)
   - Shipping cost input (shown if flat rate selected)
   - Free shipping threshold input (shown if free over amount selected)

3. **Currency Section**
   - Currency dropdown (USD, EUR, GBP, etc.)

4. **Contact Information Section**
   - Store hours textarea
   - Contact email input
   - Contact phone input

5. **Social Media Section**
   - Facebook URL input
   - Twitter URL input
   - Instagram URL input

6. **Policies Section**
   - Return policy textarea (rich text or simple textarea)

7. **Action Buttons**
   - Save Settings button
   - Reset to Defaults button

### UI Design Pattern
- Follow existing admin page patterns (AdminProducts, AdminCategories)
- Use card-based layout with sections
- Real-time validation for numeric fields (tax rate, shipping cost)
- Success/error toast notifications
- Loading states during save

### Files to Create
- `src/pages/admin/AdminSettings.jsx` - Main settings page component

### Files to Modify
- `src/components/AdminLayout.jsx` - Add "Settings" menu item with gear icon
- `src/App.jsx` - Add route for `/admin/settings`

## Phase 4: Frontend Display

### Apply Settings Across Store
1. Update navigation to show store name from settings
2. Display tax calculation in checkout using settings tax_rate
3. Display shipping cost calculation using settings
4. Show currency symbol from settings throughout the app
5. Display return policy in footer or dedicated page

### Files to Modify
- `src/App.jsx` - Use store name from settings in navigation
- `src/pages/Checkout.jsx` - Apply tax and shipping from settings
- `src/components/Footer.jsx` (if exists) - Show contact info, social links, return policy

## Algorithm: Settings Initialization

1. On first load, if no settings exist, create default settings row
2. Store settings are fetched once on app load and cached in context
3. Admin can update settings, which triggers:
   - Update in database
   - Refresh context cache
   - Show success notification
4. For tax/shipping calculations:
   - Fetch settings from context
   - Apply formulas based on settings type
   - Display in checkout summary

## Implementation Notes

- Keep it simple: Use text inputs and basic validation
- Logo upload can start as URL input (file upload can be added later as enhancement)
- Settings should be singleton (only one row in table) - enforce via check constraint or application logic
- Use optimistic updates where appropriate
- Cache settings in React Context to avoid repeated DB queries
- Provide sensible defaults so store works out of the box
