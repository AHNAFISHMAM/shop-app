# Reviews & Ratings Feature

## Description
Implement a complete reviews and ratings system where verified buyers can leave star ratings (1-5 stars) and written reviews with optional photo uploads. Reviews will appear on product pages with average ratings, sorting capabilities, and admin moderation features.

## Phase 1: Data Layer

### Database Schema

**New Table: `product_reviews`**
- `id` (UUID, primary key)
- `product_id` (UUID, references products.id)
- `user_id` (UUID, references auth.users.id, nullable for guest orders)
- `order_id` (UUID, references orders.id) - To verify purchase
- `order_item_id` (UUID, references order_items.id) - Specific purchased item
- `rating` (INTEGER, CHECK rating >= 1 AND rating <= 5)
- `review_text` (TEXT, nullable)
- `review_images` (TEXT[], array of image URLs, nullable)
- `is_verified_purchase` (BOOLEAN, default true) - Badge indicator
- `is_hidden` (BOOLEAN, default false) - Admin moderation flag
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_product_reviews_product_id` on product_id
- `idx_product_reviews_user_id` on user_id
- `idx_product_reviews_rating` on rating
- `idx_product_reviews_created_at` on created_at DESC
- `idx_product_reviews_is_hidden` on is_hidden

**RLS Policies:**
- Public can view non-hidden reviews
- Authenticated users can create reviews for products they've purchased (verified via order_items)
- Users can update/delete their own reviews
- Admins can view all reviews (including hidden)
- Admins can update reviews (hide/unhide)

**Migration File:** `supabase/migrations/019_create_reviews_table.sql`

### Verification Logic

**Purchase Verification Function:**
Create a PostgreSQL function `verify_user_purchased_product(user_id UUID, product_id UUID)` that:
1. Queries order_items for matching product_id
2. Joins with orders table to verify user_id matches and status is 'delivered' or 'completed'
3. Returns boolean

**Prevent Duplicate Reviews:**
- Add unique constraint on (user_id, order_item_id) to prevent multiple reviews per purchase
- Frontend validation before submission

## Phase 2A: Backend Integration

### Files to Modify/Create:

**New utility file: `src/lib/reviewsApi.js`**
Functions:
- `fetchProductReviews(productId, { sortBy, limit, offset })` - Get reviews with pagination
- `createReview({ productId, orderId, orderItemId, rating, reviewText, reviewImages })` - Submit new review
- `updateReview(reviewId, { rating, reviewText, reviewImages })` - Update existing review
- `deleteReview(reviewId)` - Delete own review
- `uploadReviewImage(file)` - Upload image to Supabase storage
- `getAverageRating(productId)` - Calculate average rating
- `canUserReview(productId)` - Check if user can review (purchased + not reviewed yet)

**Admin functions in `src/lib/reviewsApi.js`:**
- `hideReview(reviewId)` - Admin hide review
- `unhideReview(reviewId)` - Admin unhide review
- `fetchAllReviews({ filter, sortBy, limit, offset })` - Admin view all reviews

### Storage Setup:
- Create Supabase storage bucket `review-images`
- Configure RLS for authenticated users to upload
- Public read access for review images

## Phase 2B: Frontend Components

### Component Structure:

**New file: `src/components/ReviewsList.jsx`**
- Display list of reviews for a product
- Star rating display component
- Review card with: rating, text, images, reviewer name, date, "Verified Purchase" badge
- Pagination controls
- Sort dropdown (Most Recent, Highest Rating, Lowest Rating)
- Empty state when no reviews

**New file: `src/components/ReviewForm.jsx`**
- Only shown to verified purchasers
- Star rating input (interactive 1-5 stars)
- Text area for review
- Image upload (multiple files, preview thumbnails)
- Character limit indicator (e.g., max 1000 characters)
- Submit button with loading state
- Success/error feedback

**New file: `src/components/StarRating.jsx`**
- Reusable component for displaying star ratings
- Two modes: display-only and interactive
- Props: `rating`, `size`, `interactive`, `onChange`

**New file: `src/components/ProductRatingSummary.jsx`**
- Average rating display (e.g., "4.5 out of 5 stars")
- Total review count
- Rating distribution bar chart (5 stars: 60%, 4 stars: 20%, etc.)
- "Write a Review" button (conditional on purchase verification)

### Pages to Modify:

**`src/pages/ProductDetails.jsx`** (or equivalent product detail page)
- Import and render `ProductRatingSummary` near product title/price
- Import and render `ReviewsList` in product detail section
- Import and render `ReviewForm` conditionally (only if user purchased)
- Add "Reviews" tab or section

**New file: `src/pages/admin/AdminReviews.jsx`**
- Table view of all reviews
- Columns: Product, Reviewer, Rating, Review Text (truncated), Date, Status (Visible/Hidden), Actions
- Filter by: Product, Rating, Hidden/Visible, Date range
- Search by product name, reviewer name, review text
- Actions: View Full Review, Hide/Unhide button
- Pagination
- Bulk actions (optional)

**`src/App.jsx`** (or routing file)
- Add route for `/admin/reviews` → `AdminReviews`

### UI/UX Enhancements:

**Review Images:**
- Thumbnail display in review card
- Click to open lightbox/modal for full-size view
- Image carousel if multiple images

**Review Sorting:**
- Dropdown options: "Most Recent", "Highest Rating", "Lowest Rating"
- Update URL params on sort change
- Maintain sort preference in session

**Verification Badge:**
- Display green checkmark icon with "Verified Purchase" text
- Tooltip explaining what it means

**Admin Moderation:**
- Hide (not delete) inappropriate reviews
- Hidden reviews show in admin panel with "Hidden" status
- Unhide capability for false positives

## Phase 3: Algorithm Details

### Average Rating Calculation:
1. Query all non-hidden reviews for product_id
2. Sum all rating values
3. Divide by count of reviews
4. Round to 1 decimal place
5. Cache result (optional: use PostgreSQL materialized view or app-level caching)

### Purchase Verification Flow:
1. User clicks "Write a Review" on product page
2. Frontend calls `canUserReview(productId)`
3. Backend queries:
   ```sql
   SELECT oi.id as order_item_id, o.id as order_id
   FROM order_items oi
   JOIN orders o ON oi.order_id = o.id
   WHERE oi.product_id = $1
     AND o.user_id = $2
     AND o.status IN ('delivered', 'completed')
     AND NOT EXISTS (
       SELECT 1 FROM product_reviews pr
       WHERE pr.order_item_id = oi.id
     )
   LIMIT 1
   ```
4. If result found → Allow review submission with order_id and order_item_id
5. If not found → Show message "Only verified purchasers can leave reviews"

### Review Submission Flow:
1. User fills out rating (required), text (optional), uploads images (optional)
2. Frontend validates: rating selected, images < 5, each image < 5MB
3. Upload images to Supabase storage → get URLs
4. Call `createReview()` with all data
5. Backend inserts into product_reviews with is_verified_purchase=true
6. Return success → Close form, show success message, refresh reviews list

### Review Sorting:
- **Most Recent:** ORDER BY created_at DESC
- **Highest Rating:** ORDER BY rating DESC, created_at DESC
- **Lowest Rating:** ORDER BY rating ASC, created_at DESC

## Files Summary

**Migrations:**
- `supabase/migrations/019_create_reviews_table.sql`

**Backend/API:**
- `src/lib/reviewsApi.js` (new)

**Components:**
- `src/components/ReviewsList.jsx` (new)
- `src/components/ReviewForm.jsx` (new)
- `src/components/StarRating.jsx` (new)
- `src/components/ProductRatingSummary.jsx` (new)

**Pages:**
- `src/pages/ProductDetails.jsx` (modify - add reviews section)
- `src/pages/admin/AdminReviews.jsx` (new)
- `src/App.jsx` (modify - add admin reviews route)
