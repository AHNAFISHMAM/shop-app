# Feature #0011: Refund & Return System

## Description
Professional return and refund management system allowing customers to request returns from their order history and admins to manage return requests. Includes return status tracking, Stripe refund processing, and automated email notifications at each step.

## Phase 1: Data Layer

### Database Schema

Create `return_requests` table:
```sql
CREATE TABLE IF NOT EXISTS public.return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other')),
  reason_details TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'denied', 'received', 'refunded')),
  admin_notes TEXT,
  refund_amount DECIMAL(10, 2),
  stripe_refund_id TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Return Request Items Tracking
Create `return_request_items` table to track which items are being returned:
```sql
CREATE TABLE IF NOT EXISTS public.return_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### RLS Policies
- Users can view their own return requests
- Users can create return requests for their own orders (within 30 days)
- Admins can view all return requests
- Admins can update return request status and notes
- Public cannot access return requests

### Files to Create
- `supabase/migrations/023_create_return_requests_table.sql` - Create tables and policies

## Phase 2: Customer Return Request UI

### Add Return Request Button to Order History
File: `src/pages/OrderHistory.jsx`

Features:
1. **Return Eligibility Check**
   - Show "Request Return" button only if:
     - Order is delivered
     - Order is less than 30 days old
     - No existing return request for this order

2. **Return Request Modal**
   - Select items to return (checkbox for each item with quantity selector)
   - Select return reason (dropdown)
   - Add detailed explanation (textarea)
   - Preview return amount
   - Submit button

3. **Return Status Display**
   - Show return status badge if return exists
   - Show return timeline/progress indicator
   - Display return instructions if approved

### Files to Create/Modify
- `src/components/ReturnRequestModal.jsx` - Modal for requesting returns
- `src/pages/OrderHistory.jsx` - Add return request functionality
- `src/lib/returnRequests.js` - Utility functions for return operations

## Phase 3: Admin Return Management

### Create Admin Returns Page
File: `src/pages/admin/AdminReturns.jsx`

Features:
1. **Returns List View**
   - Display all return requests with filters (status, date range)
   - Show: Order ID, Customer, Reason, Status, Date, Amount
   - Search by order ID or customer email
   - Real-time updates for new requests

2. **Return Details View**
   - Full order details
   - Items being returned
   - Customer's reason and details
   - Timeline of status changes
   - Admin action buttons (Approve, Deny, Mark Received, Process Refund)

3. **Admin Actions**
   - **Approve**: Set status to "approved", generate return instructions
   - **Deny**: Set status to "denied", add admin notes
   - **Mark Received**: Set status to "received"
   - **Process Refund**: Trigger Stripe refund, set status to "refunded"

4. **Return Instructions Template**
   - Auto-generated return shipping label info
   - Instructions displayed to customer
   - Email notification

### Files to Create
- `src/pages/admin/AdminReturns.jsx` - Admin returns management page
- `src/components/admin/ReturnDetailsModal.jsx` - Modal for viewing/managing return details

### Files to Modify
- `src/components/AdminLayout.jsx` - Add "Returns" menu item
- `src/App.jsx` - Add `/admin/returns` route

## Phase 4: Stripe Refund Integration

### Create Stripe Refund Function
File: `supabase/functions/process-refund/index.ts`

Features:
1. **Refund Processing**
   - Accept return_request_id
   - Verify return is in "received" status
   - Get original payment intent from order
   - Process refund through Stripe API
   - Update return_request with refund_id and status
   - Send refund confirmation email

2. **Partial Refunds**
   - Calculate refund amount based on items being returned
   - Handle shipping cost refund logic

3. **Error Handling**
   - Handle Stripe API errors
   - Rollback on failure
   - Log all refund attempts

### Alternative: Direct Refund from Admin UI
If Stripe Edge Functions are complex, provide manual refund process:
1. Admin processes refund manually in Stripe Dashboard
2. Admin enters Stripe refund ID in return request
3. System marks return as refunded
4. Sends email notification

### Files to Create
- `supabase/functions/process-refund/index.ts` - Stripe refund edge function (optional)
- `src/lib/stripeRefunds.js` - Stripe refund utilities (if doing client-side)

## Phase 5: Email Notifications

### Email Notification Triggers

1. **Customer Emails**
   - Return request received (status: requested)
   - Return approved with instructions (status: approved)
   - Return denied with reason (status: denied)
   - Refund processed (status: refunded)

2. **Admin Emails**
   - New return request received
   - Return items received (when customer ships)

### Implementation Options

**Option A: Simple** (Recommended for MVP)
- Store email templates in database
- Use Supabase Edge Function to send emails via SendGrid/Mailgun
- Trigger emails on status changes

**Option B: Advanced**
- Use Loops.so integration (if already set up)
- Trigger transactional emails based on events

### Files to Create
- `supabase/functions/send-return-notification/index.ts` - Email notification function (optional)
- `src/lib/emailNotifications.js` - Email notification utilities

## Algorithm: Return Request Flow

### Customer Submits Return
1. User clicks "Request Return" on order
2. Modal opens showing order items
3. User selects items to return and quantity
4. User selects return reason and adds details
5. System calculates refund amount (item price × quantity)
6. User confirms submission
7. Create return_request with status "requested"
8. Create return_request_items for each selected item
9. Send email notification to customer (confirmation)
10. Send email notification to admin (new request)

### Admin Approves Return
1. Admin reviews return request details
2. Admin clicks "Approve" button
3. System updates status to "approved"
4. System generates return instructions
5. Send email to customer with return instructions
6. Customer ships item back

### Admin Processes Refund
1. Admin receives returned item
2. Admin clicks "Mark as Received"
3. System updates status to "received"
4. Admin clicks "Process Refund"
5. System calls Stripe refund API (or admin does manually)
6. System updates status to "refunded" with refund_id
7. Send refund confirmation email to customer

### Status Timeline
```
requested → approved/denied
          ↓
      received (if approved)
          ↓
      refunded
```

## Implementation Notes

### Simplicity First
- Start with full order returns (all items), add partial returns later
- Manual Stripe refunds in dashboard (simpler than API integration)
- Basic email templates (can enhance later)
- 30-day return window (configurable in store settings)

### Return Eligibility Rules
- Order must be in "delivered" status
- Order must be less than 30 days old (check `created_at`)
- No existing return request for the order (one return per order)

### Refund Amount Calculation
- Simple: Full order total minus shipping (or include shipping)
- Can add configuration in store settings later

### Data Alignment
- Database: `return_request`, `status`, `customer_email` (snake_case)
- JavaScript: `returnRequest`, `status`, `customerEmail` (camelCase)
- Ensure consistent transformation

### Security Considerations
- Validate user owns order before allowing return request
- Admin-only actions for approve/deny/refund
- Rate limit return requests to prevent abuse
- Validate refund amount matches order total

## Future Enhancements

1. **Partial Returns**
   - Return only specific items from order
   - Already supported with return_request_items table

2. **Return Shipping Labels**
   - Integrate with ShipStation or EasyPost
   - Generate prepaid return labels

3. **Restocking**
   - Add returned items back to inventory
   - Track return condition (sellable/damaged)

4. **Return Analytics**
   - Return rate by product
   - Most common return reasons
   - Average return processing time

5. **Automated Refunds**
   - Auto-refund when marked as received
   - Configurable approval rules
