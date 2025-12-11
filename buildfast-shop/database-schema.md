# Database Schema Reference

## Products Table

The admin products form requires a `products` table in your Supabase database with the following structure:

### Required Table: `products`

```sql
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to insert products
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to view all products
CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to update products
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow admins to delete products
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Allow public (unauthenticated) users to view products
CREATE POLICY "Public can view products"
ON public.products FOR SELECT
TO public
USING (true);
```

### Categories

The form uses these categories:
- Electronics
- Clothing
- Home & Garden
- Books
- Sports
- Other

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL above to create the table and policies
4. The form will now work correctly!

## Notes

- The `id` field is auto-generated (UUID)
- `created_at` and `updated_at` are automatically set
- RLS policies ensure only admins can modify products
- Public users can view products (for the customer-facing Products page)

