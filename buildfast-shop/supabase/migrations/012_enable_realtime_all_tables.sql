-- Migration: Enable Realtime on menu_items, dishes, products, categories, cart_items, and addresses tables
-- Description: Enables real-time subscriptions for multiple tables (only if they exist)
-- Run this in your Supabase SQL Editor

-- Enable Realtime for menu_items table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'menu_items'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'menu_items'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
    END IF;
    ALTER TABLE public.menu_items REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Enable Realtime for dishes table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dishes'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'dishes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
    END IF;
    ALTER TABLE public.dishes REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Enable Realtime for products table (if exists - legacy)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'products'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'products'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
    ALTER TABLE public.products REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Enable Realtime for categories table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'categories'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'categories'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    END IF;
    ALTER TABLE public.categories REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Enable Realtime for cart_items table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cart_items'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'cart_items'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
    END IF;
    ALTER TABLE public.cart_items REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Enable Realtime for addresses table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'addresses'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'addresses'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.addresses;
    END IF;
    ALTER TABLE public.addresses REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Enable Realtime for store_settings table (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'store_settings'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'store_settings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
    END IF;
    ALTER TABLE public.store_settings REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Note: After running this migration, all existing tables will emit real-time events
-- that can be subscribed to from the frontend using Supabase Realtime subscriptions.
-- Tables that don't exist will be skipped gracefully.

