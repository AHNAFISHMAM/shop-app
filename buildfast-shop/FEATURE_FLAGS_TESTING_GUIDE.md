# Feature Flags Testing Guide (Phases 3-7)

## Overview
This guide provides comprehensive testing procedures for all 8 feature flags across the application.

---

## Prerequisites

- [ ] Phase 1: Database migration completed
- [ ] Phase 2: Code fixes completed
- [ ] Application running locally or in staging
- [ ] Admin account access
- [ ] Two browser windows (for real-time testing)

---

## Phase 3: Component Testing

### Test 3.1: Enable Loyalty Program (`enable_loyalty_program`)

#### Components to Test:
1. **HomePage.jsx** - Loyalty banner section
2. **OrderHistory.jsx** - Loyalty card display
3. **AddressBook.jsx** - Loyalty snapshot
4. **CartSidebar.jsx** - Loyalty rewards section
5. **CartBottomSheet.jsx** - Loyalty rewards section
6. **ProfileDropdown.jsx** - "Share Referral" menu item

#### Test Steps:
1. **Toggle OFF:**
   - Go to `/admin/settings`
   - Toggle "Star Rewards (Loyalty Program)" to OFF
   - Verify all 6 locations hide loyalty UI immediately
   - Check console for: `✅ Settings updated successfully: ['enable_loyalty_program']`

2. **Toggle ON:**
   - Toggle "Star Rewards (Loyalty Program)" to ON
   - Verify all 6 locations show loyalty UI immediately
   - Check console for success message

3. **Verify Each Location:**
   - **HomePage**: `/` - Loyalty banner should hide/show
   - **OrderHistory**: `/orders` - Loyalty card should hide/show
   - **AddressBook**: `/addresses` - Loyalty snapshot should hide/show
   - **CartSidebar**: Add items to cart, open sidebar - Loyalty section should hide/show
   - **CartBottomSheet**: Add items to cart, open bottom sheet - Loyalty section should hide/show
   - **ProfileDropdown**: Click profile menu - "Share Referral" should hide/show

#### Expected Results:
- ✅ All 6 locations hide/show correctly
- ✅ No console errors
- ✅ UI updates immediately (optimistic update)
- ✅ Real-time updates work (test in second browser window)

---

### Test 3.2: Enable Reservations (`enable_reservations`)

#### Components to Test:
1. **Navbar.jsx** - "RESERVE" link (desktop and mobile)
2. **Footer.jsx** - "Reservations" link
3. **ContactPage.jsx** - "Concierge Request" action
4. **ReservationsPage.jsx** - Redirects to home if disabled
5. **MenuPage.jsx** - MenuReservationDrawer
6. **QuickActionsBar.jsx** - "Book Now" link

#### Test Steps:
1. **Toggle OFF:**
   - Go to `/admin/settings`
   - Toggle "Reservations" to OFF
   - Verify all 6 locations hide/redirect immediately

2. **Toggle ON:**
   - Toggle "Reservations" to ON
   - Verify all 6 locations show immediately

3. **Verify Each Location:**
   - **Navbar**: Desktop and mobile nav - "RESERVE" link should hide/show
   - **Footer**: Footer - "Reservations" link should hide/show
   - **ContactPage**: `/contact` - "Concierge Request" action should hide/show
   - **ReservationsPage**: `/reservations` - Should redirect to home if disabled
   - **MenuPage**: `/menu` - MenuReservationDrawer should hide/show
   - **QuickActionsBar**: Scroll down - "Book Now" link should hide/show

#### Expected Results:
- ✅ All 6 locations hide/show/redirect correctly
- ✅ ReservationsPage redirects with toast message if disabled
- ✅ No console errors
- ✅ UI updates immediately

---

### Test 3.3: Enable Menu Filters (`enable_menu_filters`)

#### Components to Test:
1. **MenuPage.jsx** - MenuEnhancementsPanel
2. **CollapsibleSidebar.jsx** - Filters section
3. **MenuEnhancementsPanel.jsx** - Dietary/allergen filters

#### Test Steps:
1. **Toggle OFF:**
   - Go to `/admin/settings`
   - Toggle "Menu Filters" to OFF
   - Go to `/menu`
   - Verify MenuEnhancementsPanel hides immediately

2. **Toggle ON:**
   - Toggle "Menu Filters" to ON
   - Verify MenuEnhancementsPanel shows immediately

3. **Verify Functionality:**
   - **Desktop**: MenuEnhancementsPanel on right side should hide/show
   - **Mobile**: CollapsibleSidebar filters should hide/show
   - **Filters**: Dietary and allergen filters should hide/show

#### Expected Results:
- ✅ MenuEnhancementsPanel hides/shows correctly
- ✅ Filters are hidden when disabled
- ✅ No console errors
- ✅ UI updates immediately

---

### Test 3.4: Enable Product Customization (`enable_product_customization`)

#### Components to Test:
1. **MenuPage.jsx** - Passes `enableCustomization` prop
2. **ProductCard.jsx** - Customization UI

#### Test Steps:
1. **Toggle OFF:**
   - Go to `/admin/settings`
   - Toggle "Product Customization" to OFF
   - Go to `/menu`
   - Verify customization button is hidden in ProductCard

2. **Toggle ON:**
   - Toggle "Product Customization" to ON
   - Verify customization button shows in ProductCard

3. **Verify Functionality:**
   - **Customization Button**: Should hide/show in ProductCard
   - **Add-ons**: Should be hidden when disabled
   - **Spice Level Selector**: Should be hidden when disabled
   - **Customization Modal**: Should not open when disabled

#### Expected Results:
- ✅ Customization button hides/shows correctly
- ✅ Add-ons and spice level UI are hidden when disabled
- ✅ No console errors
- ✅ UI updates immediately

---

### Test 3.5: Enable Order Tracking (`enable_order_tracking`)

#### Components to Test:
1. **Checkout.jsx** - OrderTimeline
2. **OrderHistory.jsx** - OrderTimeline

#### Test Steps:
1. **Toggle OFF:**
   - Go to `/admin/settings`
   - Toggle "Order Tracking" to OFF
   - Go to `/checkout` (with items in cart)
   - Verify OrderTimeline is hidden after order creation

2. **Toggle ON:**
   - Toggle "Order Tracking" to ON
   - Verify OrderTimeline shows after order creation

3. **Verify Functionality:**
   - **Checkout**: After placing order, OrderTimeline should hide/show
   - **OrderHistory**: In order details, OrderTimeline should hide/show
   - **Timeline Display**: Should show order status progression

#### Expected Results:
- ✅ OrderTimeline hides/shows correctly in Checkout
- ✅ OrderTimeline hides/shows correctly in OrderHistory
- ✅ No console errors
- ✅ UI updates immediately

---

### Test 3.6: Enable Order Feedback (`enable_order_feedback`)

#### Components to Test:
1. **OrderHistory.jsx** - Feedback form

#### Test Steps:
1. **Toggle OFF:**
   - Go to `/admin/settings`
   - Toggle "Order Feedback" to OFF
   - Go to `/orders`
   - Expand a delivered order
   - Verify feedback form is hidden

2. **Toggle ON:**
   - Toggle "Order Feedback" to ON
   - Verify feedback form shows for delivered orders

3. **Verify Functionality:**
   - **Feedback Form**: Should only show for delivered orders
   - **Rating Selection**: Should work when enabled
   - **Feedback Submission**: Should work when enabled

#### Expected Results:
- ✅ Feedback form hides/shows correctly
- ✅ Only shows for delivered orders
- ✅ No console errors
- ✅ UI updates immediately

---

### Test 3.7: Enable Marketing Opt-ins (`enable_marketing_optins`)

#### Components to Test:
1. **Checkout.jsx** - Marketing opt-ins section

#### Test Steps:
1. **Toggle OFF:**
   - Go to `/admin/settings`
   - Toggle "Marketing Opt-ins" to OFF
   - Go to `/checkout` (with items in cart)
   - Verify opt-ins section is hidden

2. **Toggle ON:**
   - Toggle "Marketing Opt-ins" to ON
   - Verify opt-ins section shows

3. **Verify Functionality:**
   - **Opt-ins Section**: Should hide/show in Checkout
   - **Email Opt-in**: Should be hidden when disabled
   - **SMS Opt-in**: Should be hidden when disabled
   - **Order Payload**: Should not include `marketingPreferences` when disabled

#### Expected Results:
- ✅ Opt-ins section hides/shows correctly
- ✅ `marketingPreferences` not included in order payload when disabled
- ✅ No console errors
- ✅ UI updates immediately

---

### Test 3.8: Enable Quick Reorder (`enable_quick_reorder`)

#### Components to Test:
1. **MenuPage.jsx** - Quick reorder items
2. **CollapsibleSidebar.jsx** - Quick reorder section
3. **MenuEnhancementsPanel.jsx** - Quick reorder section

#### Test Steps:
1. **Toggle OFF:**
   - Go to `/admin/settings`
   - Toggle "Quick Reorder" to OFF
   - Go to `/menu`
   - Add items to cart (to create quick reorder history)
   - Verify quick reorder section is hidden

2. **Toggle ON:**
   - Toggle "Quick Reorder" to ON
   - Verify quick reorder section shows

3. **Verify Functionality:**
   - **Quick Reorder Section**: Should hide/show in MenuEnhancementsPanel
   - **Quick Reorder Items**: Should be hidden when disabled
   - **Register Quick Reorder**: Should not be called when disabled

#### Expected Results:
- ✅ Quick reorder section hides/shows correctly
- ✅ `registerQuickReorderItem` not called when disabled
- ✅ No console errors
- ✅ UI updates immediately

---

## Phase 4: Real-Time Updates Testing

### Setup:
1. Open two browser windows:
   - **Window 1**: `/admin/settings` (logged in as admin)
   - **Window 2**: Any public page (e.g., `/menu`, `/`)
2. Open DevTools Console in both windows

### Test Steps:

1. **Toggle Flag in Window 1:**
   - In Window 1, toggle any feature flag ON/OFF
   - Check Window 1 console:
     - Should see: `✅ Settings updated successfully: ['enable_xxx']`
     - Should see: `✅ Store settings updated (real-time): {...}`

2. **Verify Window 2 Updates:**
   - Check Window 2 console:
     - Should see: `✅ Real-time subscription active for store_settings`
     - Should see: `✅ Store settings updated (real-time): {...}`
   - Verify Window 2 UI updates immediately (within 1-2 seconds)
   - No page refresh required

3. **Repeat for All Flags:**
   - Test all 8 feature flags individually
   - Verify each flag updates in real-time

### Expected Results:
- ✅ Immediate UI update in Window 2
- ✅ No page refresh required
- ✅ Console logs show successful subscription
- ✅ Real-time updates work for all 8 flags

### Error Scenarios:

#### Network Disconnect:
1. Disconnect network in Window 1
2. Toggle flag in Window 1
3. Verify:
   - Optimistic update shows immediately in Window 1
   - Error message displayed after timeout
   - Rollback occurs after error
   - Previous state restored

#### Subscription Timeout:
1. Check console for: `⏱️ Real-time subscription timed out - retrying...`
2. Verify:
   - Retry logic activates
   - Subscription reconnects after 2 seconds
   - UI updates after reconnection

---

## Phase 5: Loading State Testing

### Test Steps:

1. **Clear Browser Cache:**
   - Clear browser cache and cookies
   - Close and reopen browser

2. **Throttle Network:**
   - Open DevTools → Network → Throttle to "Slow 3G"
   - Reload page

3. **Observe Loading:**
   - Features should be hidden during loading
   - No flicker of disabled features
   - Features appear after settings load

### Expected Results:
- ✅ Flags default to `false` during loading
- ✅ Features hidden until settings load
- ✅ No visual flicker
- ✅ Features appear smoothly after load

### Components to Test:
- HomePage.jsx
- MenuPage.jsx
- Checkout.jsx
- OrderHistory.jsx
- Navbar.jsx
- Footer.jsx
- ProfileDropdown.jsx
- CartSidebar.jsx
- CartBottomSheet.jsx
- AddressBook.jsx
- ContactPage.jsx
- ReservationsPage.jsx
- QuickActionsBar.jsx

---

## Phase 6: Edge Cases and Error Handling

### Test 6.1: Database Errors

#### Test Steps:
1. Disconnect from Supabase (network disconnect)
2. Toggle a flag in AdminSettings
3. Verify:
   - Optimistic update shows immediately
   - Error message displayed
   - Rollback occurs after error
   - Previous state restored

#### Expected Results:
- ✅ Optimistic update works
- ✅ Error handling works
- ✅ Rollback works correctly
- ✅ No UI crashes

---

### Test 6.2: Settings Null/Undefined

#### Test Steps:
1. Simulate settings = null (temporarily modify context)
2. Verify:
   - Flags default to `false`
   - No errors in console
   - UI renders without crashes

#### Expected Results:
- ✅ Flags default correctly
- ✅ No console errors
- ✅ UI renders successfully

---

### Test 6.3: Real-Time Subscription Failure

#### Test Steps:
1. Disable real-time replication in Supabase
2. Toggle a flag
3. Verify:
   - Console shows error: `❌ Real-time subscription error`
   - UI still updates via direct database update
   - No crashes

#### Expected Results:
- ✅ Error handling works
- ✅ UI updates via direct update
- ✅ No crashes

---

### Test 6.4: Concurrent Updates

#### Test Steps:
1. Open two admin windows
2. Toggle different flags simultaneously
3. Verify:
   - Both updates succeed
   - Real-time updates reflect both changes
   - No conflicts

#### Expected Results:
- ✅ Both updates succeed
- ✅ Real-time updates work
- ✅ No conflicts

---

## Phase 7: Final Verification and Documentation

### Code Review Checklist:
- [ ] All 8 feature flags implemented
- [ ] All 13 components updated
- [ ] QuickActionsBar.jsx fixed
- [ ] Loading states handled
- [ ] Real-time updates working
- [ ] Error handling implemented
- [ ] No linter errors
- [ ] No console errors

### Testing Checklist:
- [ ] All 8 flags tested individually
- [ ] Real-time updates tested
- [ ] Loading states tested
- [ ] Error scenarios tested
- [ ] Edge cases tested
- [ ] Cross-browser tested (Chrome, Firefox, Safari)

### Documentation:
- [ ] Implementation documented
- [ ] Testing procedures documented
- [ ] Troubleshooting guide created
- [ ] Known issues documented

---

## Troubleshooting

### Issue: Real-Time Updates Not Working

**Symptoms:**
- Changes in Window 1 don't update Window 2
- Console shows: `❌ Real-time subscription error`

**Solutions:**
1. Verify real-time replication is enabled in Supabase Dashboard
2. Check RLS policies allow public read access
3. Verify subscription is active: Check console for `✅ Real-time subscription active`
4. Check network connectivity
5. Verify Supabase project is active

### Issue: Features Flicker on Page Load

**Symptoms:**
- Features briefly appear then disappear
- Features show when they should be hidden

**Solutions:**
1. Verify loading states are handled correctly
2. Check flags default to `false` during loading
3. Verify `settingsLoading` is used correctly
4. Check context is loading settings on mount

### Issue: Optimistic Updates Not Working

**Symptoms:**
- UI doesn't update immediately after toggle
- Updates only after database response

**Solutions:**
1. Verify `updateSettings` function implements optimistic updates
2. Check rollback logic is implemented
3. Verify error handling works correctly
4. Check console for errors

---

## Success Criteria

### Phase 3: Component Testing
- [ ] All 8 feature flags tested individually
- [ ] All components hide/show correctly
- [ ] No console errors
- [ ] UI updates immediately

### Phase 4: Real-Time Updates
- [ ] Real-time updates work in second browser window
- [ ] Updates occur within 1-2 seconds
- [ ] No page refresh required
- [ ] Console logs show successful subscription

### Phase 5: Loading States
- [ ] No flicker on page load
- [ ] Features hidden during loading
- [ ] Features appear after settings load

### Phase 6: Edge Cases
- [ ] Error handling works correctly
- [ ] Rollback works on errors
- [ ] No crashes on edge cases
- [ ] Concurrent updates work

### Phase 7: Final Verification
- [ ] All tests pass
- [ ] Documentation complete
- [ ] No known issues
- [ ] Ready for production

---

## Additional Resources

- Database setup: `FEATURE_FLAGS_PHASE1_DATABASE_SETUP.md`
- Implementation summary: See main README or documentation
- Migration file: `supabase/migrations/076_add_feature_flags.sql`

