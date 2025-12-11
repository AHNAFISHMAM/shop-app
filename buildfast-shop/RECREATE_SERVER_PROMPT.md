# Complete Server Recreation Prompt

Copy this entire prompt to recreate the exact server setup:

---

## Project Request:

Create a complete full-stack restaurant/café e-commerce application called "Star Café" with the following EXACT specifications:

### Tech Stack:
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (dark theme: bg-[#0A0A0F], gold accents: #C59D5F)
- **Backend**: Supabase (PostgreSQL database)
- **State Management**: React Context API
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Heroicons
- **Payments**: Stripe integration
- **Image API**: Pexels API for auto-generating food images

### Design Theme:
- **Primary Background**: `#0A0A0F` (very dark gray, almost black)
- **Secondary Background**: `#0F0F14` (cards)
- **Accent Color**: `#C59D5F` (gold)
- **Text**: White/gray scale
- **Style**: Modern, minimalist, luxury restaurant aesthetic

### Project Structure:
```
buildfast-shop/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── BulkImageAssignment.jsx (Pexels auto-generate)
│   │   │   └── ImageUploadModal.jsx
│   │   ├── menu/
│   │   │   └── ProductCard.jsx
│   │   ├── AdminLayout.jsx
│   │   ├── AdminRoute.jsx
│   │   └── MainLayout.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   └── StoreSettingsContext.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   └── imageUtils.js
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminMenuItems.jsx
│   │   │   ├── AdminOrders.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   ├── AdminReservations.jsx
│   │   │   └── AdminReviews.jsx
│   │   ├── HomePage.jsx
│   │   ├── MenuPage.jsx
│   │   ├── OrderPage.jsx
│   │   └── ImageTest.jsx (diagnostic page)
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 015_guest_checkout.sql
│       ├── 019_reviews.sql
│       ├── 020_customer_addresses.sql
│       ├── 022_store_settings.sql
│       └── 023_refund_returns.sql
└── .env
```

### Database Schema (Supabase PostgreSQL):

#### Core Tables:
1. **menu_items**
   - id (uuid, primary key)
   - category_id (uuid, foreign key)
   - name (text, required)
   - description (text)
   - price (numeric, required)
   - image_url (text)
   - dietary_tags (text[])
   - spice_level (integer, 0-3)
   - prep_time (integer, minutes)
   - is_available (boolean, default true)
   - is_featured (boolean)
   - is_todays_menu (boolean)
   - is_daily_special (boolean)
   - created_at, updated_at (timestamps)

2. **categories**
   - id, name, description, display_order, is_active

3. **orders**
   - id, customer_id, guest_email, total_amount, status
   - shipping_address (jsonb)
   - payment_intent_id (Stripe)
   - created_at, updated_at

4. **order_items**
   - order_id, menu_item_id, quantity, price_at_time

5. **customers**
   - id (uuid, references auth.users)
   - email, full_name, phone
   - created_at

6. **customer_addresses**
   - id, customer_id, address_line1, address_line2
   - city, state, postal_code, country
   - is_default (boolean)

7. **reviews**
   - id, menu_item_id, customer_id
   - rating (1-5), comment
   - is_verified, is_approved
   - created_at

8. **reservations**
   - id, customer_name, email, phone
   - date, time, party_size
   - special_requests, status

9. **store_settings**
   - id (singleton), store_name, description
   - logo_url, tax_rate, currency
   - shipping_type (flat_rate/free_over_amount/always_free)
   - shipping_cost, free_shipping_threshold
   - contact_email, contact_phone
   - social_media (jsonb)
   - return_policy, return_window_days

10. **return_requests**
    - id, order_id, customer_id
    - items (jsonb), reason, status
    - admin_notes, refund_amount
    - created_at, updated_at

### Key Features to Implement:

#### 1. Admin Dashboard
- Menu item management with CRUD operations
- **Bulk image assignment with Pexels API auto-generation**:
  - Batch processing (10 items at a time)
  - Cache-busting timestamps
  - Cancel button during generation
  - Progress tracking with toast notifications
  - Uses Pexels `src.medium` format
- Order management with status updates
- Customer reviews moderation
- Reservation management
- Store settings configuration
- Return/refund system

#### 2. Customer Features
- Browse menu with category filtering
- Add to cart with quantity selection
- Guest checkout OR authenticated checkout
- Multiple saved addresses
- Product reviews and ratings (verified purchases only)
- Wishlist functionality
- Order tracking
- Return requests (within 30 days of delivery)

#### 3. Image System (CRITICAL - This is what you want):
- **Auto-Generate Images Button**:
  - Fetches from Pexels API: `https://api.pexels.com/v1/search`
  - Authorization header: `VITE_PEXELS_API_KEY`
  - Uses `photo.src.medium` URL (NOT custom parameters)
  - Adds cache-busting: `&cache=${Date.now()}`
  - Batch processing: 10 items at a time with 2-second delays
  - Cancel button (red) appears during generation
  - Progress toasts show batch completion

- **Image Display**:
  - Force refresh with `imageRefreshKey` state
  - Cache-busting on display: `?refresh=${imageRefreshKey}`
  - React key forcing re-render: `key="${item.id}-${imageRefreshKey}"`
  - Auto-refresh after bulk assignment
  - Manual green "Refresh" button
  - RED "Hard Reload" button (nuclear cache clear)
  - `loading="eager"` to prevent lazy loading issues
  - onLoad/onError handlers with console logging
  - Gray background (`bg-gray-800`) during load
  - Transparent overlay (NOT black): `bg-transparent group-hover:bg-black`

- **Placeholder Images**:
  - Canvas-generated 400x300 pixels
  - Gold background with centered text
  - Auto-generated for items without images

#### 4. Authentication & Authorization
- Supabase Auth with email/password
- Admin role check via profiles table
- Protected admin routes with AdminRoute component
- Guest checkout support

#### 5. Payment Integration
- Stripe checkout session creation
- Order confirmation emails (via Loops.so)
- Refund processing through Stripe

### Environment Variables (.env):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_PEXELS_API_KEY=your_pexels_api_key
```

### Package.json Dependencies:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "react-hot-toast": "^2.4.1",
    "react-hook-form": "^7.48.2",
    "@stripe/stripe-js": "^2.2.0",
    "@stripe/react-stripe-js": "^2.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}
```

### Tailwind Config (tailwind.config.js):
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0A0A0F',
        'dark-bg-secondary': '#0F0F14',
        'gold': '#C59D5F',
        'text-main': '#FFFFFF',
        'text-muted': '#9CA3AF'
      }
    }
  }
}
```

### Critical Implementation Details:

#### Pexels Image Generation (BulkImageAssignment.jsx):
```javascript
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const BATCH_SIZE = 10;

// Fetch image
const response = await fetch(
  `https://api.pexels.com/v1/search?query=${encodeURIComponent(menuItem.name + ' food dish')}&per_page=1&orientation=landscape`,
  { headers: { 'Authorization': PEXELS_API_KEY } }
);

const data = await response.json();
const baseUrl = data.photos[0].src.medium; // Use medium, NOT custom params
const cacheBuster = Date.now();
const imageUrl = `${baseUrl}&cache=${cacheBuster}`;
```

#### Image Display with Force Refresh (AdminMenuItems.jsx):
```javascript
const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

function getImageDisplay(item) {
  if (item.image_url) {
    const url = item.image_url.trim();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}refresh=${imageRefreshKey}`;
  }
  return generatePlaceholderImage(item.name);
}

// Force refresh after bulk assign
setImageRefreshKey(Date.now());
```

#### Card Overlay (Must be transparent, NOT black):
```javascript
<div className="relative group bg-gray-800">
  <img
    key={`${item.id}-${imageRefreshKey}`}
    src={getImageDisplay(item)}
    className="w-full h-48 object-cover bg-gray-800"
    loading="eager"
    onLoad={(e) => console.log(`✅ Image loaded: ${item.name}`)}
    onError={(e) => {
      console.error(`❌ Failed: ${item.name}`, e.target.src);
      e.target.src = generatePlaceholderImage(item.name);
    }}
  />
  <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-60">
    <button className="opacity-0 group-hover:opacity-100">📸 Change Image</button>
  </div>
</div>
```

### RLS Policies (Row Level Security):
- Enable RLS on all tables
- Public read access for menu_items, categories
- Authenticated users can create orders, reviews
- Admins can UPDATE/DELETE all records
- Guest checkout allowed via service role

### Additional Features:
- Low stock alerts (threshold configurable)
- Discount codes (percentage or fixed amount)
- Recently viewed products (localStorage)
- Wishlist with auth prompt for guests
- Email notifications via Loops.so
- Responsive design (mobile-first)
- Loading states and error handling
- Toast notifications for all actions

### Diagnostic Tools:
- `/image-test` page to test Pexels API
- Console logging for image load success/failure
- Network tab debugging helper
- SQL diagnostic files

### IMPORTANT NOTES:
1. **NEVER use `crossOrigin="anonymous"`** on img tags (causes cache issues)
2. **Use Pexels `src.medium` directly** (no custom w=, h= parameters)
3. **Always add cache-busting** timestamps to URLs
4. **Black overlay must be TRANSPARENT by default** (only black on hover)
5. **Image refresh key** must update after every bulk assignment
6. **Batch processing** prevents API rate limiting
7. **Hard reload button** does `window.location.reload(true)`

---

## Expected Result:
A fully functional restaurant e-commerce platform with:
- ✅ Dark luxury theme (#0A0A0F + gold #C59D5F)
- ✅ Pexels auto-image generation that WORKS (not black)
- ✅ Admin dashboard with full CRUD
- ✅ Customer ordering system
- ✅ Reviews, reservations, returns
- ✅ Store settings management
- ✅ Stripe payment integration
- ✅ Guest + authenticated checkout
- ✅ Responsive design
- ✅ Production-ready code

This exact setup creates the "buildfast-shop" application as it exists right now.
