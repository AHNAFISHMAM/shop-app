-- Migration: Update reviews to support menu items and enhance order recording
-- Description: Adds menu item support to product reviews, updates helper
--              functions/policies, and expands order creation to capture guest
--              details plus variant metadata.

-- ==============================
-- Product Reviews adjustments
-- ==============================

ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE;

ALTER TABLE public.product_reviews
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.product_reviews
  DROP CONSTRAINT IF EXISTS product_reviews_product_or_menu_check;

ALTER TABLE public.product_reviews
  ADD CONSTRAINT product_reviews_product_or_menu_check
  CHECK (product_id IS NOT NULL OR menu_item_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_product_reviews_menu_item_id ON public.product_reviews(menu_item_id);

-- ==============================
-- Order items variant metadata
-- ==============================

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS combination_id UUID;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_combination_id ON public.order_items(combination_id);

-- ==============================
-- Helper Functions
-- ==============================

CREATE OR REPLACE FUNCTION verify_user_purchased_product(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS TABLE (
  order_id UUID,
  order_item_id UUID
) AS $$
BEGIN
  IF p_product_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT o.id AS order_id, oi.id AS order_item_id
  FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE (
      oi.product_id = p_product_id
      OR oi.menu_item_id = p_product_id
    )
    AND (
      o.user_id = p_user_id
      OR (
        o.user_id IS NULL
        AND o.customer_email IN (
          SELECT email FROM auth.users WHERE id = p_user_id
        )
      )
    )
    AND o.status IN ('delivered', 'shipped', 'processing')
    AND NOT EXISTS (
      SELECT 1
      FROM public.product_reviews pr
      WHERE pr.order_item_id = oi.id
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_product_average_rating(p_product_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  IF p_product_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT ROUND(AVG(rating)::numeric, 1)
  INTO avg_rating
  FROM public.product_reviews
  WHERE (product_id = p_product_id OR menu_item_id = p_product_id)
    AND is_hidden = false;

  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_product_review_count(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  review_count INTEGER;
BEGIN
  IF p_product_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)
  INTO review_count
  FROM public.product_reviews
  WHERE (product_id = p_product_id OR menu_item_id = p_product_id)
    AND is_hidden = false;

  RETURN COALESCE(review_count, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_product_rating_distribution(p_product_id UUID)
RETURNS TABLE (
  rating INTEGER,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_reviews INTEGER;
BEGIN
  IF p_product_id IS NULL THEN
    total_reviews := 0;
  ELSE
    SELECT COUNT(*)
    INTO total_reviews
    FROM public.product_reviews
    WHERE (product_id = p_product_id OR menu_item_id = p_product_id)
      AND is_hidden = false;
  END IF;

  RETURN QUERY
  SELECT
    r.rating,
    COUNT(pr.id) AS count,
    CASE
      WHEN total_reviews > 0 THEN ROUND((COUNT(pr.id)::numeric / total_reviews * 100), 1)
      ELSE 0
    END AS percentage
  FROM (SELECT generate_series(1, 5) AS rating) r
  LEFT JOIN public.product_reviews pr
    ON pr.rating = r.rating
    AND (pr.product_id = p_product_id OR pr.menu_item_id = p_product_id)
    AND pr.is_hidden = false
  GROUP BY r.rating
  ORDER BY r.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- Policies
-- ==============================

DROP POLICY IF EXISTS "Users can create reviews for purchased products" ON public.product_reviews;

CREATE POLICY "Users can create reviews for purchased products"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE oi.id = order_item_id
      AND (
        oi.product_id = product_id
        OR oi.menu_item_id = menu_item_id
        OR oi.product_id = menu_item_id
        OR oi.menu_item_id = product_id
      )
      AND (
        o.user_id = auth.uid()
        OR (
          o.user_id IS NULL
          AND o.customer_email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
        )
      )
      AND o.status IN ('delivered', 'shipped', 'processing')
  )
);

-- ==============================
-- create_order_with_items enhancements
-- ==============================

CREATE OR REPLACE FUNCTION public.create_order_with_items(
  _user_id UUID,
  _customer_email TEXT,
  _customer_name TEXT,
  _shipping_address JSONB,
  _items JSONB,
  _subtotal NUMERIC DEFAULT NULL,
  _discount_code_id UUID DEFAULT NULL,
  _discount_amount NUMERIC DEFAULT 0,
  _guest_session_id TEXT DEFAULT NULL,
  _is_guest BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  _order_id UUID;
  _calculated_subtotal NUMERIC(10,2) := 0;
  _order_total NUMERIC(10,2);
  _item JSONB;
  _item_price NUMERIC(10,2);
  _item_quantity INTEGER;
  _item_menu_item_id UUID;
  _item_product_id UUID;
  _item_variant_id UUID;
  _item_combination_id UUID;
  _item_variant_metadata JSONB;
  _normalized_discount NUMERIC(10,2) := GREATEST(COALESCE(_discount_amount, 0), 0);
  _has_dishes BOOLEAN := to_regclass('public.dishes') IS NOT NULL;
  _has_products BOOLEAN := to_regclass('public.products') IS NOT NULL;
  _has_variant_combinations BOOLEAN := to_regclass('public.variant_combinations') IS NOT NULL;
  _final_guest_session_id TEXT := NULL;
  _final_is_guest BOOLEAN := FALSE;
BEGIN
  IF _customer_email IS NULL OR TRIM(_customer_email) = '' THEN
    RAISE EXCEPTION 'customer_email is required';
  END IF;

  IF _customer_name IS NULL OR TRIM(_customer_name) = '' THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;

  IF _shipping_address IS NULL THEN
    RAISE EXCEPTION 'shipping_address is required';
  END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items array cannot be empty';
  END IF;

  _final_is_guest := COALESCE(_is_guest, _user_id IS NULL);
  IF _final_is_guest THEN
    _final_guest_session_id := NULLIF(COALESCE(_guest_session_id, ''), '');
    IF _final_guest_session_id IS NULL THEN
      RAISE EXCEPTION 'guest_session_id is required for guest orders';
    END IF;
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _item_price := COALESCE((_item->>'price_at_purchase')::NUMERIC, 0);
    _item_quantity := COALESCE((_item->>'quantity')::INTEGER, 0);
    _item_menu_item_id := NULLIF(_item->>'menu_item_id', '')::UUID;
    _item_product_id := NULLIF(_item->>'product_id', '')::UUID;
    _item_variant_id := NULLIF(_item->>'variant_id', '')::UUID;
    _item_combination_id := NULLIF(_item->>'combination_id', '')::UUID;
    _item_variant_metadata := _item->'variant_metadata';

    IF _item_menu_item_id IS NULL AND _item_product_id IS NULL THEN
      RAISE EXCEPTION 'Each item must include a menu_item_id or product_id';
    END IF;

    IF _item_price <= 0 THEN
      RAISE EXCEPTION 'Invalid price for cart item';
    END IF;

    IF _item_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for cart item';
    END IF;

    IF _item_menu_item_id IS NOT NULL THEN
      PERFORM 1
      FROM public.menu_items
      WHERE id = _item_menu_item_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Menu item % is not available', _item_menu_item_id;
      END IF;
    END IF;

    IF _item_product_id IS NOT NULL THEN
      IF _has_dishes THEN
        PERFORM 1
        FROM public.dishes
        WHERE id = _item_product_id;

        IF NOT FOUND THEN
          IF _has_products THEN
            PERFORM 1 FROM public.products WHERE id = _item_product_id;
            IF NOT FOUND THEN
              RAISE EXCEPTION 'Legacy product % is not available', _item_product_id;
            END IF;
          ELSE
            RAISE EXCEPTION 'Legacy product % is not available', _item_product_id;
          END IF;
        END IF;
      ELSIF _has_products THEN
        PERFORM 1 FROM public.products WHERE id = _item_product_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Legacy product % is not available', _item_product_id;
        END IF;
      ELSE
        RAISE EXCEPTION 'Legacy product % is not available', _item_product_id;
      END IF;
    END IF;

    IF _item_combination_id IS NOT NULL AND _has_variant_combinations THEN
      PERFORM 1 FROM public.variant_combinations WHERE id = _item_combination_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant combination % is not available', _item_combination_id;
      END IF;
    END IF;

    _calculated_subtotal := _calculated_subtotal + (_item_price * _item_quantity);
  END LOOP;

  _order_total := _calculated_subtotal - _normalized_discount;
  IF _order_total < 0 THEN
    _order_total := 0;
  END IF;

  INSERT INTO public.orders (
    user_id,
    customer_email,
    customer_name,
    shipping_address,
    subtotal,
    discount_code_id,
    discount_amount,
    order_total,
    status,
    guest_session_id,
    is_guest
  ) VALUES (
    _user_id,
    TRIM(_customer_email),
    TRIM(_customer_name),
    _shipping_address,
    _calculated_subtotal,
    _discount_code_id,
    _normalized_discount,
    _order_total,
    'pending',
    _final_guest_session_id,
    _final_is_guest
  )
  RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      product_id,
      quantity,
      price_at_purchase,
      variant_id,
      combination_id,
      variant_metadata
    ) VALUES (
      _order_id,
      NULLIF(_item->>'menu_item_id', '')::UUID,
      NULLIF(_item->>'product_id', '')::UUID,
      (_item->>'quantity')::INTEGER,
      (_item->>'price_at_purchase')::NUMERIC,
      NULLIF(_item->>'variant_id', '')::UUID,
      NULLIF(_item->>'combination_id', '')::UUID,
      _item->'variant_metadata'
    );
  END LOOP;

  RETURN _order_id;
END;
$$;

-- Friendly notice
DO $$
BEGIN
  RAISE NOTICE '✅ Reviews now support menu items and orders capture guest sessions + variants';
END $$;

