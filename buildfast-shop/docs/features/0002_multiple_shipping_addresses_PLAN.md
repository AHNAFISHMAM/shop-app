# Feature 0002: Multiple Shipping Addresses (Address Book)

## Description

Allow customers to save and manage multiple delivery addresses in their account. Customers can add, edit, delete, and label addresses (e.g., "Home", "Work"), set one as default, and choose which address to use during checkout.

## Files to Create/Modify

### Phase 1: Data Layer (Backend)

#### Database Migration
- **File**: `supabase/migrations/020_create_customer_addresses_table.sql`
  - Create `customer_addresses` table with columns:
    - `id` (UUID, primary key)
    - `user_id` (UUID, foreign key to auth.users)
    - `label` (TEXT, e.g., "Home", "Work", "Office")
    - `full_name` (TEXT)
    - `address_line1` (TEXT)
    - `address_line2` (TEXT, nullable)
    - `city` (TEXT)
    - `state` (TEXT)
    - `postal_code` (TEXT)
    - `country` (TEXT)
    - `phone` (TEXT, nullable)
    - `is_default` (BOOLEAN, default false)
    - `created_at` (TIMESTAMPTZ)
    - `updated_at` (TIMESTAMPTZ)
  - Add indexes on `user_id` and `is_default`
  - Add RLS policies:
    - Users can view their own addresses
    - Users can create their own addresses
    - Users can update their own addresses
    - Users can delete their own addresses
    - Admins can view all addresses
  - Add trigger to auto-update `updated_at`
  - Add constraint: only one default address per user

#### API Functions
- **File**: `src/lib/addressesApi.js` (NEW)
  - `fetchUserAddresses(userId)` - Get all addresses for a user
  - `getDefaultAddress(userId)` - Get the default address
  - `createAddress(addressData)` - Create new address
  - `updateAddress(addressId, updates)` - Update existing address
  - `deleteAddress(addressId)` - Delete address
  - `setDefaultAddress(addressId, userId)` - Set address as default (unset others)

### Phase 2: UI Components

#### Address Book Page
- **File**: `src/pages/AddressBook.jsx` (NEW)
  - Display list of saved addresses as cards
  - Each card shows:
    - Label badge (Home, Work, etc.)
    - Full name
    - Complete address
    - Phone number
    - "Default" badge if is_default
    - Edit button
    - Delete button (with confirmation)
    - "Set as Default" button
  - "Add New Address" button (opens modal)
  - Empty state when no addresses
  - Loading state
  - Error handling

#### Address Form Component
- **File**: `src/components/AddressForm.jsx` (NEW)
  - Reusable form for adding/editing addresses
  - Fields:
    - Label (dropdown: Home, Work, Office, Other + custom input)
    - Full Name
    - Address Line 1
    - Address Line 2 (optional)
    - City
    - State/Province
    - Postal Code
    - Country (dropdown)
    - Phone (optional)
    - Set as default (checkbox)
  - Validation for required fields
  - Cancel and Save buttons

#### Address Card Component
- **File**: `src/components/AddressCard.jsx` (NEW)
  - Display single address in card format
  - Props: address data, onEdit, onDelete, onSetDefault
  - Shows label, name, address, phone
  - Default badge
  - Action buttons (Edit, Delete, Set Default)

#### Address Modal Component
- **File**: `src/components/AddressModal.jsx` (NEW)
  - Modal wrapper for AddressForm
  - Props: isOpen, onClose, address (for edit mode), onSave
  - Handles create and edit modes
  - Shows "Add Address" or "Edit Address" title

### Phase 3: Checkout Integration

#### Modify Checkout Page
- **File**: `src/pages/Checkout.jsx` (MODIFY)
  - Add "Saved Addresses" section before manual address entry
  - Display saved addresses as selectable cards
  - Allow selecting a saved address (radio buttons)
  - Pre-fill address form when saved address selected
  - Option to "Use a different address" (shows manual form)
  - "Save this address" checkbox on manual form
  - Button to open Address Book modal to add new address

### Phase 4: Navigation & Account Integration

#### App Navigation
- **File**: `src/App.jsx` (MODIFY)
  - Add route: `/account/addresses` → AddressBook component

#### Account/Profile Page
- **File**: `src/pages/Account.jsx` or similar (MODIFY)
  - Add "Address Book" link/button in account navigation
  - Show count of saved addresses
  - Quick link to manage addresses

## Algorithm Details

### Setting Default Address
When user sets an address as default:
1. Start database transaction
2. Set `is_default = false` for all user's addresses
3. Set `is_default = true` for selected address
4. Commit transaction
5. Refresh UI to show new default

### Deleting Address
When user deletes an address:
1. Show confirmation modal: "Are you sure you want to delete this address?"
2. If confirmed:
   - Check if it's the default address
   - Delete from database
   - If it was default and other addresses exist:
     - Automatically set the first remaining address as default
   - Refresh address list
3. Show success message

### Checkout Address Selection
When user is at checkout:
1. Fetch all saved addresses
2. Identify default address (highlight it)
3. Allow user to select any address via radio button
4. When selected:
   - Copy address data to checkout form
   - Disable manual editing (show "Edit" button to modify)
5. If "Use different address" clicked:
   - Clear selection
   - Enable manual form
   - Show "Save this address" checkbox

## Data Structures

### Address Object (camelCase for frontend)
```javascript
{
  id: 'uuid',
  userId: 'uuid',
  label: 'Home',
  fullName: 'John Doe',
  addressLine1: '123 Main St',
  addressLine2: 'Apt 4B',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'United States',
  phone: '+1234567890',
  isDefault: true,
  createdAt: '2025-11-06T...',
  updatedAt: '2025-11-06T...'
}
```

### Database Schema (snake_case)
```sql
customer_addresses (
  id uuid,
  user_id uuid,
  label text,
  full_name text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  phone text,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz
)
```

## RLS Policies Required

1. **Users can view own addresses**: `user_id = auth.uid()`
2. **Users can create own addresses**: `user_id = auth.uid()`
3. **Users can update own addresses**: `user_id = auth.uid()`
4. **Users can delete own addresses**: `user_id = auth.uid()`
5. **Admins can view all addresses**: Check `customers.is_admin = true`

## UI/UX Requirements

- Address cards should have hover effects and clear CTAs
- Default address should have a prominent badge/indicator
- Empty state should encourage adding first address
- Delete confirmation prevents accidental deletions
- Form validation provides clear error messages
- Loading states during API calls
- Success/error toasts for all actions
- Responsive design for mobile and desktop
- Professional styling matching existing app theme
