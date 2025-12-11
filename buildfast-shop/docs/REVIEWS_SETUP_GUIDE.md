# Reviews & Ratings - Setup Guide

## Overview
This guide walks you through the final manual steps to complete the Reviews & Ratings feature implementation.

## What's Already Done ✅

1. **Database Migration Created**: `supabase/migrations/20251106030641_create_reviews_table.sql`
2. **Backend API**: `src/lib/reviewsApi.js` with all CRUD operations
3. **Frontend Components**:
   - `StarRating.jsx` - Star rating display/input
   - `ProductRatingSummary.jsx` - Rating summary with distribution
   - `ReviewForm.jsx` - Review submission form
   - `ReviewsList.jsx` - Reviews display with pagination
4. **Admin Page**: `AdminReviews.jsx` - Review moderation interface
5. **Integration**: Reviews added to product detail pages
6. **Routing**: Admin reviews route configured

## Manual Setup Required 🔧

**IMPORTANT**: The reviews feature will work WITHOUT the storage bucket! Images are optional. However, to enable image uploads, complete both steps below.

### Step 1: Apply Database Migration (REQUIRED)

The database migration needs to be applied manually via the Supabase dashboard:

1. **Open Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your project: `buildfast-shop`

2. **Navigate to SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration Content**:
   - Open: `supabase/migrations/20251106030641_create_reviews_table.sql`
   - Copy the entire contents

4. **Execute Migration**:
   - Paste the SQL into the SQL Editor
   - Click "Run" to execute
   - Verify success message appears

5. **Verify Tables Created**:
   - Go to "Table Editor" in the left sidebar
   - You should see a new table: `product_reviews`
   - Verify all columns exist:
     - id, product_id, user_id, order_id, order_item_id
     - rating, review_text, review_images
     - is_verified_purchase, is_hidden
     - created_at, updated_at

### Step 2: Create Storage Bucket for Review Images (OPTIONAL - for image uploads)

**Note**: Skip this step if you don't need image uploads. Reviews will work fine with just text and ratings.

1. **Navigate to Storage**:
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

2. **Configure Bucket**:
   - Bucket name: `review-images`
   - Public bucket: ✅ **Check this** (reviews images need to be publicly accessible)
   - File size limit: `5 MB` (recommended)
   - Allowed MIME types: `image/*`

3. **Set Storage Policies**:
   After creating the bucket, set up these RLS policies:

   **Policy 1: Public Read Access**
   ```sql
   CREATE POLICY "Public can view review images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'review-images');
   ```

   **Policy 2: Authenticated Upload**
   ```sql
   CREATE POLICY "Authenticated users can upload review images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'review-images');
   ```

   **Policy 3: Users can delete own images**
   ```sql
   CREATE POLICY "Users can delete own review images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'review-images'
     AND (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

4. **Apply Storage Policies**:
   - Go to Storage > review-images bucket
   - Click "Policies" tab
   - Click "New Policy"
   - Paste each policy above and save

### Step 3: Verify RLS Functions

Check that the following PostgreSQL functions were created successfully:

1. `verify_user_purchased_product(user_id, product_id)` - Verifies purchase eligibility
2. `get_product_average_rating(product_id)` - Calculates average rating
3. `get_product_review_count(product_id)` - Counts reviews
4. `get_product_rating_distribution(product_id)` - Gets star distribution

To verify:
- Go to SQL Editor
- Run: `SELECT proname FROM pg_proc WHERE proname LIKE '%review%' OR proname LIKE '%rating%';`
- Confirm all 4 functions appear

## Testing Checklist ✅

After completing the setup, test the following:

### As a Customer (Non-Admin):

1. **View Reviews**:
   - [ ] Visit any product detail page
   - [ ] Reviews section appears at the bottom
   - [ ] Average rating and distribution display correctly
   - [ ] Can sort reviews (Most Recent, Highest, Lowest)
   - [ ] Pagination works for many reviews

2. **Leave a Review** (requires order):
   - [ ] Purchase a product (complete checkout)
   - [ ] Admin: Change order status to "shipped" or "delivered"
   - [ ] Return to product page
   - [ ] "Write a Review" button appears
   - [ ] Click button → Review form opens
   - [ ] Fill out rating (1-5 stars)
   - [ ] Add review text (optional)
   - [ ] Upload images (optional, up to 5)
   - [ ] Submit review successfully
   - [ ] Review appears in list immediately
   - [ ] "Verified Purchase" badge shows

3. **Edit/Delete Own Review**:
   - [ ] Find your review in the list
   - [ ] Can edit rating and text
   - [ ] Can delete your review
   - [ ] Cannot edit/delete other users' reviews

### As an Admin:

1. **Review Management Page**:
   - [ ] Navigate to Admin > Reviews
   - [ ] All reviews display in table format
   - [ ] Can see product name, reviewer, rating, text
   - [ ] Search by product/reviewer/text works
   - [ ] Filter by Visible/Hidden works
   - [ ] Can click "View" to see full review details

2. **Moderation**:
   - [ ] Click "Hide" on a review → Review hidden from customers
   - [ ] Hidden reviews still visible in admin panel
   - [ ] Can "Unhide" hidden reviews
   - [ ] Hidden reviews don't count in ratings/distribution

3. **Review Details Modal**:
   - [ ] Click "View" on any review
   - [ ] Modal shows full review details
   - [ ] Product info displays with image
   - [ ] Reviewer email and verified badge shown
   - [ ] All review images appear
   - [ ] Can hide/unhide from modal

## Feature Highlights 🌟

### For Customers:
- ⭐ Leave ratings (1-5 stars) with written reviews
- 📸 Upload up to 5 images per review
- ✅ "Verified Purchase" badge for credibility
- 📊 View rating distribution and average
- 🔄 Sort reviews multiple ways
- 📱 Responsive design for mobile

### For Admins:
- 🛡️ Hide inappropriate reviews (not delete)
- 🔍 Search and filter reviews
- 📋 View all review details
- 👀 See hidden reviews in admin panel
- 🔄 Unhide false positives easily

## Troubleshooting

### Migration Errors

**Error: "relation already exists"**
- Table may have been created before
- Safe to ignore if table structure matches

**Error: "function already exists"**
- Functions may have been created before
- Safe to ignore if function logic matches

### Storage Issues

**Error: "Bucket already exists"**
- Bucket may have been created before
- Verify policies are set correctly

**Error: "Permission denied" when uploading**
- Check storage policies are set correctly
- Verify user is authenticated

### Review Submission Issues

**"You have already reviewed this product"**
- Constraint prevents duplicate reviews per purchase
- User can only review each ordered item once

**"Only verified purchasers can leave reviews"**
- User must have completed an order with this product
- Order status must be "delivered", "shipped", or "processing"

### Rating Not Updating

**Average rating not changing**
- Check if review is hidden (hidden reviews don't count)
- Verify RPC functions are working

## Architecture Notes

### Database Design:
- Reviews tied to specific `order_item_id` (not just product)
- Prevents multiple reviews per purchase
- Supports guest orders (user_id can be null)
- RLS policies ensure security

### Image Storage:
- Images stored in `review-images/{user_id}/{timestamp}.{ext}`
- Organized by user ID for easy management
- Public URLs for fast loading
- 5MB limit per image

### Security:
- RLS ensures users can only modify own reviews
- Admins can moderate any review
- Purchase verification via database query
- Unique constraint prevents review spam

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard > Logs)
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Review the technical plan: `docs/features/0001_reviews_ratings_PLAN.md`

## Next Steps

After completing setup:
1. Test all functionality thoroughly
2. Consider adding email notifications for new reviews
3. Consider adding review reply feature (admin responses)
4. Monitor for spam/inappropriate content
5. Analyze review trends for product insights
