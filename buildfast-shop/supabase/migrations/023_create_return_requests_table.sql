-- ============================================================================
-- MIGRATION: Create Return Requests Tables
-- ============================================================================
-- This migration creates the return_requests and return_request_items tables
-- for managing product returns and refunds
-- ============================================================================

-- Create return_requests table
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

-- Create return_request_items table (for tracking which items are being returned)
CREATE TABLE IF NOT EXISTS public.return_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON public.return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_created_at ON public.return_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_return_request_items_return_id ON public.return_request_items(return_request_id);
CREATE INDEX IF NOT EXISTS idx_return_request_items_order_item_id ON public.return_request_items(order_item_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_return_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Update processed_at when status changes from 'requested'
  IF OLD.status = 'requested' AND NEW.status IN ('approved', 'denied') AND NEW.processed_at IS NULL THEN
    NEW.processed_at = NOW();
  END IF;

  -- Update refunded_at when status changes to 'refunded'
  IF NEW.status = 'refunded' AND NEW.refunded_at IS NULL THEN
    NEW.refunded_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at and timestamps
DROP TRIGGER IF EXISTS update_return_requests_updated_at ON public.return_requests;
CREATE TRIGGER update_return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_return_requests_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_request_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for return_requests

-- Policy: Users can view their own return requests
CREATE POLICY "Users can view own return requests"
ON public.return_requests FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy: Users can create return requests for their own orders
CREATE POLICY "Users can create return requests"
ON public.return_requests FOR INSERT
TO authenticated
WITH CHECK (
  -- Verify the order belongs to the user
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_id
    AND (
      orders.user_id = auth.uid()
      OR
      orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  AND
  -- Ensure order is within 30 days
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_id
    AND orders.created_at >= NOW() - INTERVAL '30 days'
  )
  AND
  -- Ensure order is delivered
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_id
    AND orders.status = 'delivered'
  )
  AND
  -- Ensure no existing return request for this order
  NOT EXISTS (
    SELECT 1 FROM public.return_requests
    WHERE return_requests.order_id = return_requests.order_id
  )
);

-- Policy: Admins can view all return requests
CREATE POLICY "Admins can view all return requests"
ON public.return_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Admins can update return requests
CREATE POLICY "Admins can update return requests"
ON public.return_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for return_request_items

-- Policy: Users can view their own return request items
CREATE POLICY "Users can view own return request items"
ON public.return_request_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.return_requests
    WHERE return_requests.id = return_request_id
    AND (
      return_requests.user_id = auth.uid()
      OR
      return_requests.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Users can insert return request items when creating a return
CREATE POLICY "Users can create return request items"
ON public.return_request_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.return_requests
    WHERE return_requests.id = return_request_id
    AND (
      return_requests.user_id = auth.uid()
      OR
      return_requests.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Policy: Admins can view all return request items
CREATE POLICY "Admins can view all return request items"
ON public.return_request_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Enable realtime for return requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_request_items;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration worked)
-- ============================================================================

-- Check that the tables were created
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'return_requests'
) AS return_requests_exists,
EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'return_request_items'
) AS return_request_items_exists;

-- Check that RLS is enabled
SELECT
  relname,
  relrowsecurity,
  relforcerowsecurity
FROM pg_class
WHERE relname IN ('return_requests', 'return_request_items');

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('return_requests', 'return_request_items')
ORDER BY tablename, policyname;
