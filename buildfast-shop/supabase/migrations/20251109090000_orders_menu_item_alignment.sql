-- =====================================================
-- ORDERS + ORDER_ITEMS ALIGNMENT
-- Date: 2025-11-09
-- Align checkout/order pipeline with menu_items catalog
-- =====================================================

-- 1. Ensure orders schema has subtotal and discount tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_code_id UUID,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0);

-- Add foreign key for discount_code_id if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'discount_codes'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_discount_code_id_fkey
      FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Backfill subtotal/discount_amount defaults
UPDATE public.orders
SET
  discount_amount = COALESCE(discount_amount, 0),
  subtotal = CASE
    WHEN COALESCE(subtotal, 0) = 0
      THEN COALESCE(order_total, 0) + COALESCE(discount_amount, 0)
    ELSE subtotal
  END;

CREATE INDEX IF NOT EXISTS idx_orders_discount_code_id ON public.orders(discount_code_id);

-- 2. Align order_items to menu_items while keeping legacy dishes references
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS menu_item_id UUID;

-- Legacy product_id becomes optional
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- Drop old constraints and recreate with canonical mapping
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_or_menu_item_check;
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_legacy_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_menu_item_id_fkey
    FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'dishes'
  ) THEN
    EXECUTE 'ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_legacy_fkey FOREIGN KEY (product_id) REFERENCES public.dishes(id) ON DELETE SET NULL';
  ELSE
    EXECUTE 'ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_legacy_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_or_menu_item_check
    CHECK (
      menu_item_id IS NOT NULL OR product_id IS NOT NULL
    );

-- 3. Backfill menu_item_id where possible via name + price match
WITH matched AS (
  SELECT
    oi.id,
    mi.id AS menu_item_id
  FROM public.order_items oi
  JOIN public.dishes d
    ON d.id = oi.product_id
  JOIN public.menu_items mi
    ON LOWER(mi.name) = LOWER(d.name)
   AND ABS(mi.price - d.price) < 0.01
  WHERE oi.menu_item_id IS NULL
)
UPDATE public.order_items oi
SET menu_item_id = matched.menu_item_id
FROM matched
WHERE matched.id = oi.id;

CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id);

-- 4. Refresh create_order_with_items RPC to support dual catalog IDs
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  _user_id UUID,
  _customer_email TEXT,
  _customer_name TEXT,
  _shipping_address JSONB,
  _items JSONB,
  _subtotal NUMERIC DEFAULT NULL,
  _discount_code_id UUID DEFAULT NULL,
  _discount_amount NUMERIC DEFAULT 0
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
  _normalized_discount NUMERIC(10,2) := GREATEST(COALESCE(_discount_amount, 0), 0);
  _has_dishes BOOLEAN := to_regclass('public.dishes') IS NOT NULL;
  _has_products BOOLEAN := to_regclass('public.products') IS NOT NULL;
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

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _item_price := COALESCE((_item->>'price_at_purchase')::NUMERIC, 0);
    _item_quantity := COALESCE((_item->>'quantity')::INTEGER, 0);
    _item_menu_item_id := NULLIF(_item->>'menu_item_id', '')::UUID;
    _item_product_id := NULLIF(_item->>'product_id', '')::UUID;

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
    status
  ) VALUES (
    _user_id,
    TRIM(_customer_email),
    TRIM(_customer_name),
    _shipping_address,
    _calculated_subtotal,
    _discount_code_id,
    _normalized_discount,
    _order_total,
    'pending'
  )
  RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      product_id,
      quantity,
      price_at_purchase
    ) VALUES (
      _order_id,
      NULLIF(_item->>'menu_item_id', '')::UUID,
      NULLIF(_item->>'product_id', '')::UUID,
      (_item->>'quantity')::INTEGER,
      (_item->>'price_at_purchase')::NUMERIC
    );
  END LOOP;

  RETURN _order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items(UUID, TEXT, TEXT, JSONB, JSONB, NUMERIC, UUID, NUMERIC) TO anon, authenticated;

-- Friendly notices
DO $$
BEGIN
  RAISE NOTICE '✅ orders table updated with subtotal & discount tracking';
  RAISE NOTICE '✅ order_items now reference menu_items with legacy dish fallback';
END $$;

