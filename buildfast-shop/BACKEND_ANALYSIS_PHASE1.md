# Backend Analysis - Phase 1: Current Dependencies & Data Structures

## Date: 2025-11-07
## Status: ✅ COMPLETED

---

## 1. SUPABASE TABLES USED

### Current Cart.jsx Tables:
- **`cart_items`** - User's cart items
- **`dishes`** - Product catalog
- **`product_variants`** - Single product variants
- **`variant_combinations`** - Multi-variant combinations

### Current OrderPage.jsx Tables:
- **`dishes`** - Product catalog
- **`categories`** - Product categories
- **`subcategories`** - Product subcategories
- **`cart_items`** - (via useCartManagement hook)

### Tables Needed for Merge:
All of the above ✅

---

## 2. DATA STRUCTURE ANALYSIS

### A. Dishes Query Structure

#### Cart.jsx (Line 111-115):
```javascript
const { data, error } = await supabase
  .from('dishes')
  .select('*')
  .eq('id', productId)
  .single()
```
**Returns:** Flat dish object with all columns
**Storage:** Stored in `products` state as `{ [productId]: dishData }`

#### OrderPage.jsx (Line 62-73):
```javascript
const { data: dishesData } = await supabase
  .from('dishes')
  .select(`
    *,
    subcategories (
      id,
      name,
      categories (id, name)
    )
  `)
  .eq('is_active', true)
  .order('name');
```
**Returns:** Dish object with NESTED subcategories and categories
**Structure:**
```javascript
{
  id: "uuid",
  name: "string",
  description: "string",
  price: number,
  images: array,
  stock_quantity: number,
  dietary_tags: array,
  spice_level: number,
  chef_special: boolean,
  is_active: boolean,
  subcategory_id: "uuid",
  category_id: "uuid",
  subcategories: {
    id: "uuid",
    name: "string",
    categories: {
      id: "uuid",
      name: "string"
    }
  }
}
```

**⚠️ POTENTIAL ISSUE:** Cart.jsx fetches dishes WITHOUT relations, OrderPage fetches WITH relations. Need to ensure merged page handles both cases.

### B. Cart Items Query Structure

#### Cart.jsx (Line 160-179):
```javascript
const { data: cartData, error: cartError } = await supabase
  .from('cart_items')
  .select(`
    *,
    product_variants (
      id,
      variant_type,
      variant_value,
      price_adjustment,
      stock_quantity
    ),
    variant_combinations (
      id,
      variant_values,
      price_adjustment,
      stock_quantity
    )
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

**Returns:** Cart items with NESTED variant data
**Structure:**
```javascript
{
  id: "uuid",
  user_id: "uuid",
  product_id: "uuid",
  quantity: number,
  variant_id: "uuid" | null,
  combination_id: "uuid" | null,
  created_at: "timestamp",
  product_variants: {
    id: "uuid",
    variant_type: "string",
    variant_value: "string",
    price_adjustment: number,
    stock_quantity: number
  } | null,
  variant_combinations: {
    id: "uuid",
    variant_values: object,
    price_adjustment: number,
    stock_quantity: number
  } | null
}
```

### C. Categories & Subcategories

#### OrderPage.jsx (Line 78-90):
```javascript
// Categories
const { data: categoriesData } = await supabase
  .from('categories')
  .select('*')
  .order('name');

// Subcategories
const { data: subcategoriesData } = await supabase
  .from('subcategories')
  .select('*, categories(*)')
  .order('display_order');
```

**Categories Structure:**
```javascript
{
  id: "uuid",
  name: "string",
  created_at: "timestamp"
}
```

**Subcategories Structure:**
```javascript
{
  id: "uuid",
  name: "string",
  category_id: "uuid",
  display_order: number,
  created_at: "timestamp",
  categories: {
    id: "uuid",
    name: "string"
  }
}
```

---

## 3. DATA ALIGNMENT ISSUES

### ✅ CORRECT: snake_case Consistency
All database columns use snake_case:
- `product_id` ✅
- `user_id` ✅
- `stock_quantity` ✅
- `spice_level` ✅
- `chef_special` ✅
- `dietary_tags` ✅
- `variant_values` ✅
- `price_adjustment` ✅

### ⚠️ POTENTIAL ISSUE: Property Access Patterns

#### Cart.jsx expects product data in `products` state object:
```javascript
const product = products[item.product_id]  // Line 239
```

#### OrderPage uses `dishes` state as array:
```javascript
const filteredDishes = useOrderFiltering(dishes, {...})  // Line 103
```

**MERGE CONSIDERATION:**
- Keep `products` object for cart items (fast lookup)
- Keep `dishes` array for catalog (filtering)
- Ensure no conflicts between the two

### ⚠️ NESTED OBJECT ACCESS

#### Cart.jsx accesses nested variant data:
```javascript
item.variant_combinations.variant_values  // Line 323
item.product_variants.variant_type  // Line 329
```

#### OrderPage accesses nested category data:
```javascript
dish.subcategories?.name  // Line 139
dish.subcategories.categories.id  // Line 51 (via filtering hook)
```

**✅ BOTH HANDLE NULL SAFELY** with optional chaining

---

## 4. HOOKS & UTILITIES ANALYSIS

### A. useCartManagement Hook (used by OrderPage)

**File:** `src/hooks/useCartManagement.js`

**Returns:**
```javascript
{
  cartItems,           // Array of cart items
  cartSummary,         // { subtotal, deliveryFee, total }
  fetchCartItems,      // Function to refresh
  handleAddToCart,     // Function(product)
  handleUpdateQuantity,// Function(itemId, quantity)
  handleRemoveFromCart // Function(itemId)
}
```

**Data Source:**
- Auth users: Queries `cart_items` with `dishes` relation (Line 28-31)
- Guest users: Uses `guestSessionUtils` + localStorage

**⚠️ CRITICAL:** useCartManagement queries `dishes` table as `dishes (*)` relation (Line 30), BUT Cart.jsx queries it separately. This is REDUNDANT!

**Recommendation:** Use useCartManagement's data in merged page.

### B. useOrderFiltering Hook

**File:** `src/hooks/useOrderFiltering.js`

**Parameters:**
```javascript
{
  searchQuery,           // string
  selectedCategory,      // object | null
  selectedSubcategory,   // object | null
  priceRange,           // [min, max]
  dietaryFilters,       // array of strings
  spiceLevel,           // number | null
  chefSpecialOnly,      // boolean
  inStockOnly,          // boolean
  sortBy                // string enum
}
```

**Returns:** Filtered & sorted array of dishes

**Dependencies:** Uses `useMemo` for performance ✅

### C. useFilteredSubcategories Hook

**File:** `src/hooks/useOrderFiltering.js` (same file, line 123-130)

**Parameters:**
- `subcategories` - array of all subcategories
- `selectedCategory` - currently selected category object

**Returns:** Filtered subcategories for selected category

---

## 5. REAL-TIME SUBSCRIPTIONS

### Cart.jsx (Line 32-96):
```javascript
const channel = supabase
  .channel('cart-items-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'cart_items',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Handles INSERT, UPDATE, DELETE
  })
  .subscribe()
```

**✅ PERFECT:** Real-time updates for cart items
**MERGE:** Keep this subscription in merged page

### OrderPage.jsx:
**❌ NO REAL-TIME SUBSCRIPTION** for dishes

**MERGE CONSIDERATION:**
- Don't need real-time for product catalog (changes infrequent)
- DO need real-time for cart items (keep existing subscription)

---

## 6. STATE MANAGEMENT

### Cart.jsx State:
```javascript
const [cartItems, setCartItems] = useState([])
const [products, setProducts] = useState({})   // Map of productId -> product
const [loading, setLoading] = useState(true)
const [updatingItem, setUpdatingItem] = useState(null)
const [error, setError] = useState('')
```

### OrderPage.jsx State:
```javascript
const [dishes, setDishes] = useState([])
const [categories, setCategories] = useState([])
const [subcategories, setSubcategories] = useState([])
const [selectedCategory, setSelectedCategory] = useState(null)
const [selectedSubcategory, setSelectedSubcategory] = useState(null)
const [searchQuery, setSearchQuery] = useState('')
const [priceRange, setPriceRange] = useState([0, 2000])
const [dietaryFilters, setDietaryFilters] = useState([])
const [spiceLevel, setSpiceLevel] = useState(null)
const [chefSpecialOnly, setChefSpecialOnly] = useState(false)
const [inStockOnly, setInStockOnly] = useState(false)
const [sortBy, setSortBy] = useState('name-asc')
const [loading, setLoading] = useState(true)
const [showCartSheet, setShowCartSheet] = useState(false)
const [showFilters, setShowFilters] = useState(false)
```

**Plus from useCartManagement hook:**
```javascript
const { cartItems, cartSummary, handleAddToCart, ... } = useCartManagement(user)
```

**⚠️ STATE CONFLICT:**
- Cart.jsx has `cartItems` state
- OrderPage has `cartItems` from hook
- **RESOLUTION:** Use hook version (more comprehensive)

---

## 7. GUEST USER SUPPORT

### Cart.jsx:
- ✅ Checks `if (user)` for auth vs guest
- ✅ Uses `getGuestCart()` for guest cart
- ✅ Uses `updateGuestCartQuantity()` and `removeFromGuestCart()`
- ✅ Loads guest cart on mount (Line 98-100)

### OrderPage.jsx:
- ✅ Uses `useCartManagement(user)` which handles guest internally

**MERGE:** Both properly support guest users ✅

---

## 8. IMAGE HANDLING

### Cart.jsx (Line 388-393):
```javascript
const getProductImage = (product) => {
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0]
  }
  return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop'
}
```

### OrderPage.jsx (Line 135-141):
```javascript
const getImageUrl = (dish) => {
  if (dish.images && dish.images.length > 0) {
    return dish.images[0];
  }
  const searchTerm = dish.subcategories?.name || dish.name || 'food';
  return `https://source.unsplash.com/400x400/?${searchTerm.replace(/\s+/g, ',')},food`;
}
```

**⚠️ INCONSISTENCY:**
- Cart uses static fallback
- OrderPage uses dynamic search-based fallback (better UX)

**MERGE:** Use OrderPage's dynamic approach ✅

---

## 9. PRICE CALCULATIONS

### Cart.jsx (Line 374-385):
```javascript
// Subtotal with variant price adjustments
const subtotal = cartItemsWithProducts.reduce(
  (sum, item) => sum + (getItemPrice(item) * item.quantity),
  0
)

// Shipping: FREE over $50
const shipping = subtotal > 50 ? 0 : 9.99

// Tax: 8%
const tax = subtotal * 0.08

// Grand Total
const grandTotal = subtotal + shipping + tax
```

### OrderPage.jsx (via useCartManagement, Line 72-80):
```javascript
const subtotal = cartItems.reduce(
  (sum, item) => sum + (item.dishes?.price || 0) * item.quantity,
  0
);
const deliveryFee = subtotal > 500 ? 0 : 50; // Free delivery over 500 BDT
const total = subtotal + deliveryFee;
```

**⚠️ CRITICAL INCONSISTENCY:**
- Cart.jsx: `shipping = $9.99, freeOver = $50, includes TAX 8%`
- OrderPage/hook: `delivery = 50 BDT, freeOver = 500 BDT, NO TAX`
- OrderPage uses BDT currency (৳) - Bangladeshi Taka
- Cart uses USD ($)

**⚠️ VARIANT PRICE HANDLING:**
- Cart.jsx: ✅ Includes variant price adjustments via `getItemPrice()`
- OrderPage/hook: ❌ Does NOT include variant adjustments (just base price)

**MERGE DECISION NEEDED:**
1. Which currency? (BDT or USD)
2. Tax included? (8% or none)
3. Shipping threshold? ($50 or 500 BDT)
4. Fix variant pricing in useCartManagement hook

---

## 10. ROUTING & NAVIGATION

### Cart.jsx:
- Renders at `/cart` route
- "Continue Shopping" links to `/products` (Line 421)
- Product click links to `/products/${product.id}` (Line 479, 496)

### OrderPage.jsx:
- Renders at `/order` route
- Checkout button links to `/checkout` (Line 193)
- Dish click links to `/products/${dish.id}` (Line 322, 342)

**MERGE:**
- Keep at `/cart` route ✅
- Redirect `/order` → `/cart` ✅
- Product links remain `/products/${id}` ✅

---

## 11. COMPONENT DEPENDENCIES

### Cart.jsx Imports:
```javascript
import { useAuth } from '../contexts/AuthContext'
import { getGuestCart, updateGuestCartQuantity, removeFromGuestCart } from '../lib/guestSessionUtils'
import UpdateTimestamp from '../components/UpdateTimestamp'
```

### OrderPage.jsx Imports:
```javascript
import { useAuth } from '../contexts/AuthContext'
import { useCartManagement } from '../hooks/useCartManagement'
import { useOrderFiltering, useFilteredSubcategories } from '../hooks/useOrderFiltering'
import ProductFilters from '../components/order/ProductFilters'
import CartBottomSheet from '../components/order/CartBottomSheet'
```

**MERGE NEEDS:**
- ✅ useAuth
- ✅ useCartManagement (replace Cart.jsx's manual cart handling)
- ✅ useOrderFiltering + useFilteredSubcategories
- ✅ ProductFilters component
- ✅ CartBottomSheet component (mobile)
- ⚠️ UpdateTimestamp (optional, dev mode only)

---

## 12. THEME & STYLING

### Cart.jsx:
- **Theme:** Light theme (`bg-gray-50`, `bg-white`)
- **Accent:** Blue (`#3B82F6`, `bg-blue-600`)
- **Style:** Traditional e-commerce

### OrderPage.jsx:
- **Theme:** Dark theme (`bg-[#0A0A0F]`, `bg-white/5`)
- **Accent:** Gold (`#C59D5F` as `text-accent`, `bg-accent`)
- **Style:** Luxury restaurant

**⚠️ MAJOR CONFLICT**

**MERGE DECISION:** Use OrderPage's dark + gold theme (matches Star Cafe brand)

---

## 13. RLS POLICIES REQUIRED

Based on table access patterns, these RLS policies are needed:

### `dishes` table:
- ✅ SELECT: Allow all users (public catalog)
- Filter by `is_active = true` in queries

### `cart_items` table:
- ✅ SELECT: User can read own cart (`user_id = auth.uid()`)
- ✅ INSERT: User can add to own cart
- ✅ UPDATE: User can update own cart items
- ✅ DELETE: User can remove from own cart

### `categories` & `subcategories`:
- ✅ SELECT: Allow all users (public data)

### `product_variants` & `variant_combinations`:
- ✅ SELECT: Allow all users (join with dishes)

---

## 14. KEY FINDINGS & RECOMMENDATIONS

### ✅ STRENGTHS:
1. Both pages use snake_case consistently
2. Both handle guest users properly
3. Real-time cart updates work well
4. Variant support is comprehensive
5. Filter logic is well-structured

### ⚠️ ISSUES TO FIX:

#### CRITICAL:
1. **Currency mismatch:** BDT in OrderPage vs USD in Cart
2. **Price calculation discrepancy:** Tax in Cart, no tax in OrderPage
3. **Variant pricing:** useCartManagement doesn't include variant adjustments
4. **Theme conflict:** Light vs Dark

#### HIGH:
5. **Redundant dish fetching:** Cart fetches separately, hook also fetches
6. **Image fallback inconsistency:** Dynamic vs static
7. **State duplication:** cartItems in both Cart state and hook

#### MEDIUM:
8. **No display_order for categories:** Only subcategories have sorting
9. **Cart.jsx queries dishes WITHOUT relations** (could benefit from subcategory data)

---

## 15. MERGE STRATEGY RECOMMENDATIONS

### Phase 2 Actions:

1. **Use useCartManagement hook** instead of manual cart state
2. **Fetch dishes WITH relations** (subcategories, categories)
3. **Add categories & subcategories fetching** to merged page
4. **Standardize on BDT currency** with ৳ symbol
5. **Decide on tax:** Remove or keep 8%?
6. **Use dark theme + gold accent** throughout
7. **Use dynamic image fallback** from OrderPage
8. **Fix variant pricing** in calculations

### Data Flow:
```
Merged Cart Page
├── Fetch: dishes (with subcategories/categories)
├── Fetch: categories
├── Fetch: subcategories
├── Hook: useCartManagement (handles cart_items + guest cart)
├── Hook: useOrderFiltering (filters dishes)
└── Hook: useFilteredSubcategories (filters subcats)
```

---

## PHASE 1: ✅ COMPLETED

All backend dependencies and data structures analyzed. Ready for Phase 2 implementation.
