-- =====================================================
-- FIX RLS POLICIES AND SEED DATA (CORRECTED)
-- =====================================================
-- This fixes the UUID error and uses proper PostgreSQL UUID generation
-- Researched solution: Use gen_random_uuid() built into PostgreSQL
-- =====================================================

-- Step 1: Temporarily disable RLS to allow seeding
ALTER TABLE IF EXISTS menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS menu_items DISABLE ROW LEVEL SECURITY;

-- Step 2: Clear existing data (if any)
TRUNCATE TABLE menu_items CASCADE;
TRUNCATE TABLE menu_categories CASCADE;

-- Step 3: Create a temporary table to store category IDs
-- This ensures consistent IDs between categories and items
CREATE TEMP TABLE temp_category_ids (
    name TEXT PRIMARY KEY,
    id UUID DEFAULT gen_random_uuid()
);

-- Insert category names first
INSERT INTO temp_category_ids (name) VALUES
('Set Menu (Dine In)'),
('Set Menu (Take Away)'),
('Biryani Items'),
('Bangla Menu'),
('Beef'),
('Mutton'),
('Chicken'),
('Prawn & Fish'),
('Kabab'),
('Naan'),
('Rice'),
('Pizza'),
('Burger'),
('Soup'),
('Chowmein/Pasta/Ramen'),
('Appetizers & Snacks'),
('Nachos'),
('Sizzling'),
('Vegetable'),
('Salad');

-- Step 4: Insert Categories using generated UUIDs
INSERT INTO menu_categories (id, name, slug, description, sort_order)
SELECT
    id,
    name,
    CASE name
        WHEN 'Set Menu (Dine In)' THEN 'set-menu-dine-in'
        WHEN 'Set Menu (Take Away)' THEN 'set-menu-take-away'
        WHEN 'Biryani Items' THEN 'biryani'
        WHEN 'Bangla Menu' THEN 'bangla-menu'
        WHEN 'Beef' THEN 'beef'
        WHEN 'Mutton' THEN 'mutton'
        WHEN 'Chicken' THEN 'chicken'
        WHEN 'Prawn & Fish' THEN 'prawn-fish'
        WHEN 'Kabab' THEN 'kabab'
        WHEN 'Naan' THEN 'naan'
        WHEN 'Rice' THEN 'rice'
        WHEN 'Pizza' THEN 'pizza'
        WHEN 'Burger' THEN 'burger'
        WHEN 'Soup' THEN 'soup'
        WHEN 'Chowmein/Pasta/Ramen' THEN 'noodles-pasta'
        WHEN 'Appetizers & Snacks' THEN 'appetizers'
        WHEN 'Nachos' THEN 'nachos'
        WHEN 'Sizzling' THEN 'sizzling'
        WHEN 'Vegetable' THEN 'vegetable'
        WHEN 'Salad' THEN 'salad'
    END as slug,
    CASE name
        WHEN 'Set Menu (Dine In)' THEN 'Complete meal packages for dining in'
        WHEN 'Set Menu (Take Away)' THEN 'Meal packages for takeaway'
        WHEN 'Biryani Items' THEN 'Authentic biryanis and rice dishes'
        WHEN 'Bangla Menu' THEN 'Traditional Bangladeshi cuisine'
        WHEN 'Beef' THEN 'Beef preparations'
        WHEN 'Mutton' THEN 'Mutton dishes'
        WHEN 'Chicken' THEN 'Chicken specialties'
        WHEN 'Prawn & Fish' THEN 'Seafood delicacies'
        WHEN 'Kabab' THEN 'Grilled kababs'
        WHEN 'Naan' THEN 'Fresh breads'
        WHEN 'Rice' THEN 'Rice varieties'
        WHEN 'Pizza' THEN 'Italian pizzas'
        WHEN 'Burger' THEN 'Burgers and sandwiches'
        WHEN 'Soup' THEN 'Hot soups'
        WHEN 'Chowmein/Pasta/Ramen' THEN 'Noodles and pasta'
        WHEN 'Appetizers & Snacks' THEN 'Starters and snacks'
        WHEN 'Nachos' THEN 'Loaded nachos'
        WHEN 'Sizzling' THEN 'Sizzling platters'
        WHEN 'Vegetable' THEN 'Vegetarian dishes'
        WHEN 'Salad' THEN 'Fresh salads'
    END as description,
    ROW_NUMBER() OVER (ORDER BY
        CASE name
            WHEN 'Set Menu (Dine In)' THEN 1
            WHEN 'Set Menu (Take Away)' THEN 2
            WHEN 'Biryani Items' THEN 3
            WHEN 'Bangla Menu' THEN 4
            WHEN 'Beef' THEN 5
            WHEN 'Mutton' THEN 6
            WHEN 'Chicken' THEN 7
            WHEN 'Prawn & Fish' THEN 8
            WHEN 'Kabab' THEN 9
            WHEN 'Naan' THEN 10
            WHEN 'Rice' THEN 11
            WHEN 'Pizza' THEN 12
            WHEN 'Burger' THEN 13
            WHEN 'Soup' THEN 14
            WHEN 'Chowmein/Pasta/Ramen' THEN 15
            WHEN 'Appetizers & Snacks' THEN 16
            WHEN 'Nachos' THEN 17
            WHEN 'Sizzling' THEN 18
            WHEN 'Vegetable' THEN 19
            WHEN 'Salad' THEN 20
        END
    ) as sort_order
FROM temp_category_ids;

-- Step 5: Insert Sample Menu Items (20 items to verify it works)
INSERT INTO menu_items (category_id, name, description, price, currency, is_available, is_featured, spice_level, dietary_tags, prep_time)
SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Biryani Items'),
    'Star Special Kacchi Biryani (Chinigura)',
    'Premium kacchi biryani with fragrant chinigura rice',
    250,
    'BDT',
    true,
    true,
    2,
    ARRAY['gluten-free'],
    45
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Biryani Items'),
    'Chicken Tikka Biryani',
    'Grilled chicken tikka layered with basmati rice',
    180,
    'BDT',
    true,
    false,
    2,
    ARRAY[]::text[],
    40
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Biryani Items'),
    'Mutton Biryani',
    'Tender mutton cooked with aromatic spices',
    220,
    'BDT',
    true,
    false,
    2,
    ARRAY['gluten-free'],
    50
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Chicken'),
    'Butter Chicken',
    'Creamy tomato-based chicken curry',
    280,
    'BDT',
    true,
    true,
    1,
    ARRAY[]::text[],
    30
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Chicken'),
    'Chicken Tikka Masala',
    'Grilled chicken in rich masala sauce',
    260,
    'BDT',
    true,
    false,
    2,
    ARRAY[]::text[],
    35
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Chicken'),
    'Chicken 65',
    'Crispy fried chicken with spices',
    200,
    'BDT',
    true,
    false,
    3,
    ARRAY[]::text[],
    25
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Pizza'),
    'Chicken BBQ Pizza (Medium)',
    'BBQ chicken with mozzarella',
    450,
    'BDT',
    true,
    false,
    0,
    ARRAY[]::text[],
    20
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Pizza'),
    'Margherita Pizza (Medium)',
    'Classic tomato and mozzarella',
    350,
    'BDT',
    true,
    false,
    0,
    ARRAY['vegetarian'],
    18
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Pizza'),
    'Pepperoni Pizza (Large)',
    'Loaded with pepperoni slices',
    650,
    'BDT',
    true,
    false,
    0,
    ARRAY[]::text[],
    22
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Burger'),
    'Classic Beef Burger',
    'Beef patty with lettuce and cheese',
    180,
    'BDT',
    true,
    false,
    0,
    ARRAY[]::text[],
    15
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Burger'),
    'Chicken Burger',
    'Grilled chicken breast burger',
    160,
    'BDT',
    true,
    false,
    0,
    ARRAY[]::text[],
    15
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Kabab'),
    'Seekh Kabab',
    'Minced meat kabab on skewers',
    150,
    'BDT',
    true,
    false,
    2,
    ARRAY[]::text[],
    25
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Kabab'),
    'Chicken Tikka',
    'Marinated grilled chicken pieces',
    180,
    'BDT',
    true,
    true,
    2,
    ARRAY['gluten-free'],
    30
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Vegetable'),
    'Dal Tadka',
    'Yellow lentils with tempering',
    120,
    'BDT',
    true,
    false,
    1,
    ARRAY['vegetarian', 'vegan', 'gluten-free'],
    25
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Vegetable'),
    'Paneer Butter Masala',
    'Cottage cheese in creamy gravy',
    180,
    'BDT',
    true,
    false,
    1,
    ARRAY['vegetarian'],
    30
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Salad'),
    'Caesar Salad',
    'Romaine lettuce with Caesar dressing',
    150,
    'BDT',
    true,
    false,
    0,
    ARRAY['vegetarian'],
    10
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Salad'),
    'Greek Salad',
    'Fresh vegetables with feta cheese',
    140,
    'BDT',
    true,
    false,
    0,
    ARRAY['vegetarian', 'gluten-free'],
    10
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Naan'),
    'Plain Naan',
    'Fresh tandoori bread',
    30,
    'BDT',
    true,
    false,
    0,
    ARRAY['vegetarian'],
    10
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Naan'),
    'Butter Naan',
    'Naan with butter topping',
    35,
    'BDT',
    true,
    false,
    0,
    ARRAY['vegetarian'],
    10
UNION ALL SELECT
    (SELECT id FROM temp_category_ids WHERE name = 'Naan'),
    'Garlic Naan',
    'Naan with garlic and herbs',
    40,
    'BDT',
    true,
    false,
    0,
    ARRAY['vegetarian'],
    12;

-- Step 6: Re-enable RLS with proper policies
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON menu_categories;
DROP POLICY IF EXISTS "Admin full access" ON menu_categories;
DROP POLICY IF EXISTS "Public read available items" ON menu_items;
DROP POLICY IF EXISTS "Admin full access" ON menu_items;

-- Create new policies
CREATE POLICY "Public read access"
ON menu_categories FOR SELECT
USING (true);

CREATE POLICY "Admin full access"
ON menu_categories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_user_meta_data->>'role' = 'admin'
             OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
);

CREATE POLICY "Public read available items"
ON menu_items FOR SELECT
USING (is_available = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admin full access"
ON menu_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_user_meta_data->>'role' = 'admin'
             OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
);

-- Step 7: Clean up temp table
DROP TABLE temp_category_ids;

-- Step 8: Verify success
DO $$
DECLARE
    cat_count INT;
    item_count INT;
BEGIN
    SELECT COUNT(*) INTO cat_count FROM menu_categories;
    SELECT COUNT(*) INTO item_count FROM menu_items;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SEEDING COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Categories: %', cat_count;
    RAISE NOTICE '📊 Menu Items: %', item_count;
    RAISE NOTICE '========================================';

    IF cat_count >= 20 AND item_count >= 20 THEN
        RAISE NOTICE '✅ SUCCESS! Data loaded correctly!';
        RAISE NOTICE 'Now visit: http://localhost:5173/admin/menu-items';
    ELSE
        RAISE NOTICE '⚠️  Warning: Expected 20 categories and 20+ items';
    END IF;
    RAISE NOTICE '========================================';
END $$;
