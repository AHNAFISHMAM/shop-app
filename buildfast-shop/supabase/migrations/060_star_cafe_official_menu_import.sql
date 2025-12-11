-- =====================================================
-- STAR CAFÉ OFFICIAL MENU DATA IMPORT
-- =====================================================
-- Imports the complete official Star Café menu with exact prices
-- Replaces sample data with real menu items
-- Handles pizza variants and portion sizes as separate items
-- =====================================================

-- Step 1: Clear existing sample menu items (preserve schema)
DO $$
BEGIN
  RAISE NOTICE 'Clearing existing sample menu data...';
  DELETE FROM menu_items;
  RAISE NOTICE '✓ Sample data cleared';
END $$;

-- Step 2: Upsert all 24 official categories with exact names
DO $$
BEGIN
  RAISE NOTICE 'Importing 24 official categories...';
END $$;

INSERT INTO menu_categories (name, slug, description, sort_order)
VALUES
  ('SET MENU ON DINE', 'set-menu-on-dine', 'Complete meal packages for dining in', 1),
  ('SET MENU ONLY TAKE AWAY', 'set-menu-only-take-away', 'Meal packages for takeaway orders', 2),
  ('BIRYANI ITEMS', 'biryani-items', 'Traditional biryani and special rice dishes', 3),
  ('Bangla Menu', 'bangla-menu', 'Traditional Bangladeshi dishes', 4),
  ('Fish (Mach)', 'fish-mach', 'Fresh fish preparations', 5),
  ('Beef (Goru)', 'beef-goru', 'Beef specialties', 6),
  ('Mutton (Khasi)', 'mutton-khasi', 'Mutton delicacies', 7),
  ('Chicken (Sonali Murgi)', 'chicken-sonali-murgi', 'Special chicken dishes', 8),
  ('RICE', 'rice', 'Fried rice and rice dishes', 9),
  ('BEEF', 'beef', 'Beef main courses', 10),
  ('MUTTON', 'mutton', 'Mutton main courses', 11),
  ('PRAWN & FISH', 'prawn-fish', 'Seafood specialties', 12),
  ('Kabab', 'kabab', 'Grilled kababs and tandoori', 13),
  ('Nun Bon', 'nun-bon', 'Freshly baked breads', 14),
  ('Pizza', 'pizza', 'Wood-fired pizzas', 15),
  ('Burger', 'burger', 'Gourmet burgers', 16),
  ('VEGETABLE', 'vegetable', 'Vegetable preparations', 17),
  ('SALAD', 'salad', 'Fresh salads', 18),
  ('APPETIZERS/SNACKS', 'appetizers-snacks', 'Starters and snacks', 19),
  ('SOUP', 'soup', 'Hot soups', 20),
  ('Chowmein /Pasta Chop Suey/Ramen', 'chowmein-pasta-chop-suey-ramen', 'Noodles and pasta dishes', 21),
  ('CHICKEN', 'chicken', 'Chicken main courses', 22),
  ('Nachos', 'nachos', 'Loaded nachos', 23),
  ('SIZZLING', 'sizzling', 'Sizzling platters', 24)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Step 3: Create helper function for category lookup
CREATE OR REPLACE FUNCTION get_cat_id(cat_name TEXT)
RETURNS UUID AS $$
  SELECT id FROM menu_categories WHERE name = cat_name LIMIT 1;
$$ LANGUAGE SQL IMMUTABLE;

-- Step 4: Import all official menu items with exact prices
DO $$
BEGIN
  RAISE NOTICE 'Importing 200+ official menu items...';
END $$;

INSERT INTO menu_items (
  category_id, name, description, price, currency,
  is_available, is_featured, spice_level, dietary_tags
)
VALUES

-- =================================================================
-- SET MENU ON DINE (4 items)
-- =================================================================
(get_cat_id('SET MENU ON DINE'), 'Package 01 (Dine)',
 'Fried rice, fried chicken 2 pcs, mixed vegetable, fried prawn 2 pcs, soft drink, mineral water.',
 450, 'BDT', true, false, 0, '{}'),

(get_cat_id('SET MENU ON DINE'), 'Package 02 (Dine)',
 'Fried rice, fried chicken 2 pcs, mixed vegetable, fried prawn 2 pcs, special chicken curry 2 pcs, soft drink, mineral water. Min 2 persons.',
 550, 'BDT', true, false, 0, '{}'),

(get_cat_id('SET MENU ON DINE'), 'Package 03 (Dine)',
 'Fried rice, fried chicken 2 pcs, mixed vegetable, special beef sizzling, soft drink, mineral water. Min 3 persons.',
 590, 'BDT', true, false, 0, '{}'),

(get_cat_id('SET MENU ON DINE'), 'Package 04 (Dine)',
 'Thai soup, fried wonton, fried rice, fried chicken 2 pcs, mixed vegetable, beef sizzling, soft drink, mineral water.',
 680, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- SET MENU ONLY TAKE AWAY (3 items)
-- =================================================================
(get_cat_id('SET MENU ONLY TAKE AWAY'), 'Package 01 (Take Away)',
 'Fried rice, fried chicken 2 pcs, fried prawn 2 pcs, chicken vegetable.',
 380, 'BDT', true, false, 0, '{}'),

(get_cat_id('SET MENU ONLY TAKE AWAY'), 'Package 02 (Take Away)',
 'Fried rice, fried chicken 2 pcs, fried prawn 2 pcs, special chicken curry 2 pcs, vegetables. Min 2 box.',
 450, 'BDT', true, false, 0, '{}'),

(get_cat_id('SET MENU ONLY TAKE AWAY'), 'Package 03 (Take Away)',
 'Fried rice, fried chicken 2 pcs, chicken vegetable, beef sizzling.',
 490, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- BIRYANI ITEMS (7 items)
-- =================================================================
(get_cat_id('BIRYANI ITEMS'), 'Star Special Kacchi Biryani (Chinigura Rice) with Jali Kabab',
 null, 330, 'BDT', true, true, 2, '{}'),

(get_cat_id('BIRYANI ITEMS'), 'Star Special Kacchi Biryani (Basmati Rice) with Jali Kabab',
 null, 350, 'BDT', true, false, 2, '{}'),

(get_cat_id('BIRYANI ITEMS'), 'Special Morog Polaw with Jali Kabab',
 null, 250, 'BDT', true, false, 1, '{}'),

(get_cat_id('BIRYANI ITEMS'), 'Beef Tehari',
 null, 180, 'BDT', true, false, 2, '{}'),

(get_cat_id('BIRYANI ITEMS'), 'Mutton Tehari (Min 20)',
 null, 250, 'BDT', true, false, 2, '{}'),

(get_cat_id('BIRYANI ITEMS'), 'Chicken Dum Biryani with Jali Kabab (Min 20)',
 null, 250, 'BDT', true, false, 2, '{}'),

(get_cat_id('BIRYANI ITEMS'), 'Hyderabadi Biryani with Jali Kabab (Min 20)',
 null, 450, 'BDT', true, false, 3, '{}'),

-- =================================================================
-- BANGLA MENU (8 items)
-- =================================================================
(get_cat_id('Bangla Menu'), 'Plain Rice', null, 50, 'BDT', true, false, 0, '{"vegetarian","vegan","gluten-free"}'),
(get_cat_id('Bangla Menu'), 'Bhuna Khichuri (Chicken)', null, 220, 'BDT', true, false, 2, '{}'),
(get_cat_id('Bangla Menu'), 'Bhuna Khichuri (Beef)', null, 250, 'BDT', true, false, 2, '{}'),
(get_cat_id('Bangla Menu'), 'Egg Polao', null, 200, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('Bangla Menu'), 'Mixed Vegetable', null, 50, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('Bangla Menu'), 'House Dal', null, 50, 'BDT', true, false, 0, '{"vegetarian","vegan","gluten-free"}'),
(get_cat_id('Bangla Menu'), 'Sweet Curd', null, 80, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('Bangla Menu'), 'Duck Curry (Hasher Mangsho Bhuna)', null, 1000, 'BDT', true, false, 3, '{}'),

-- =================================================================
-- FISH (Mach) (4 items)
-- =================================================================
(get_cat_id('Fish (Mach)'), 'Hilsa (Bhuna/Mustard/Fry)', null, 680, 'BDT', true, false, 2, '{}'),
(get_cat_id('Fish (Mach)'), 'Vetki (Dopiaza/Bhuna)', null, 280, 'BDT', true, false, 2, '{}'),
(get_cat_id('Fish (Mach)'), 'Rupchanda (Fry/Bhuna)', null, 450, 'BDT', true, false, 1, '{}'),
(get_cat_id('Fish (Mach)'), 'Prawn Malai Curry (2 pcs)', null, 700, 'BDT', true, false, 1, '{}'),

-- =================================================================
-- BEEF (Goru) (2 items)
-- =================================================================
(get_cat_id('Beef (Goru)'), 'Beef Rezala (4 pcs)', null, 220, 'BDT', true, false, 2, '{}'),
(get_cat_id('Beef (Goru)'), 'Beef Kala Bhuna (3 pcs)', null, 220, 'BDT', true, false, 3, '{}'),

-- =================================================================
-- MUTTON (Khasi) (2 items)
-- =================================================================
(get_cat_id('Mutton (Khasi)'), 'Khasi Mutton Rezala (4 pcs)', null, 480, 'BDT', true, false, 2, '{}'),
(get_cat_id('Mutton (Khasi)'), 'Chui Jhal Khasi Mutton (2 pcs)', null, 360, 'BDT', true, false, 3, '{}'),

-- =================================================================
-- CHICKEN (Sonali Murgi) (2 items)
-- =================================================================
(get_cat_id('Chicken (Sonali Murgi)'), 'Sonali Chicken Roast (1 pc)', null, 150, 'BDT', true, false, 1, '{}'),
(get_cat_id('Chicken (Sonali Murgi)'), 'Sonali Chicken Bhuna (Full)', null, 300, 'BDT', true, false, 2, '{}'),

-- =================================================================
-- RICE (10 items - with portion sizes as separate items)
-- =================================================================
(get_cat_id('RICE'), 'Star Sp. Fried Rice (1:3)', null, 450, 'BDT', true, true, 0, '{}'),
(get_cat_id('RICE'), 'Egg Fried Rice (1:3)', null, 300, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('RICE'), 'Thai Fried Rice (1:3)', null, 400, 'BDT', true, false, 1, '{}'),
(get_cat_id('RICE'), 'Mixed Fried Rice (1:3)', null, 400, 'BDT', true, false, 0, '{}'),
(get_cat_id('RICE'), 'Sichuan Fried Rice (1:3)', null, 400, 'BDT', true, false, 2, '{}'),
(get_cat_id('RICE'), 'Chicken Fried Rice (1:3)', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('RICE'), 'Vegetable Fried Rice (1:3)', null, 300, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('RICE'), 'Chicken Masala Rice', null, 400, 'BDT', true, false, 2, '{}'),
(get_cat_id('RICE'), 'Lump Sum Rice', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('RICE'), 'Steam Rice', null, 200, 'BDT', true, false, 0, '{"vegetarian","vegan","gluten-free"}'),

-- =================================================================
-- BEEF (7 items - with portion variants)
-- =================================================================
(get_cat_id('BEEF'), 'Beef Masala', null, 500, 'BDT', true, false, 2, '{}'),
(get_cat_id('BEEF'), 'Beef Chili Onion', null, 500, 'BDT', true, false, 2, '{}'),
(get_cat_id('BEEF'), 'Beef Chili Dry', null, 500, 'BDT', true, false, 3, '{}'),
(get_cat_id('BEEF'), 'Beef Acharya', null, 700, 'BDT', true, false, 3, '{}'),
(get_cat_id('BEEF'), 'Beef Korai', null, 750, 'BDT', true, false, 2, '{}'),
(get_cat_id('BEEF'), 'Beef Peshawar (1:2)', null, 650, 'BDT', true, false, 2, '{}'),
(get_cat_id('BEEF'), 'Beef Peshawar (1:1)', null, 330, 'BDT', true, false, 2, '{}'),

-- =================================================================
-- MUTTON (7 items - with portion variants)
-- =================================================================
(get_cat_id('MUTTON'), 'Mutton Masala', null, 600, 'BDT', true, false, 2, '{}'),
(get_cat_id('MUTTON'), 'Mutton Chili Gravy', null, 600, 'BDT', true, false, 2, '{}'),
(get_cat_id('MUTTON'), 'Mutton Chili Dry', null, 600, 'BDT', true, false, 3, '{}'),
(get_cat_id('MUTTON'), 'Mutton Acharya', null, 800, 'BDT', true, false, 3, '{}'),
(get_cat_id('MUTTON'), 'Mutton Korai', null, 800, 'BDT', true, false, 2, '{}'),
(get_cat_id('MUTTON'), 'Mutton Peshawar (1:2)', null, 750, 'BDT', true, false, 2, '{}'),
(get_cat_id('MUTTON'), 'Mutton Peshawar (1:1)', null, 350, 'BDT', true, false, 2, '{}'),

-- =================================================================
-- PRAWN & FISH (12 items)
-- =================================================================
(get_cat_id('PRAWN & FISH'), 'Lobster King Prawn (1 pc)', null, 400, 'BDT', true, false, 0, '{}'),
(get_cat_id('PRAWN & FISH'), 'Prawn Masala (8 pcs)', null, 500, 'BDT', true, false, 2, '{}'),
(get_cat_id('PRAWN & FISH'), 'Prawn Chili Onion (8 pcs)', null, 450, 'BDT', true, false, 2, '{}'),
(get_cat_id('PRAWN & FISH'), 'Garlic Prawn', null, 550, 'BDT', true, false, 1, '{}'),
(get_cat_id('PRAWN & FISH'), 'Sweet & Sour Prawn', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('PRAWN & FISH'), 'Hot & Sour Prawn', null, 450, 'BDT', true, false, 2, '{}'),
(get_cat_id('PRAWN & FISH'), 'Fish Ginger Mushroom (8 pcs)', null, 400, 'BDT', true, false, 1, '{}'),
(get_cat_id('PRAWN & FISH'), 'Fish Manchurian', null, 400, 'BDT', true, false, 2, '{}'),
(get_cat_id('PRAWN & FISH'), 'Fish 65', null, 450, 'BDT', true, false, 3, '{}'),
(get_cat_id('PRAWN & FISH'), 'Grilled Pomfret (1 pc)', null, 800, 'BDT', true, false, 0, '{}'),
(get_cat_id('PRAWN & FISH'), 'BBQ Vetki (Full, 2kg)', null, 2500, 'BDT', true, false, 0, '{}'),
(get_cat_id('PRAWN & FISH'), 'Hilsa Fry Full (1 kg)', null, 2500, 'BDT', true, false, 1, '{}'),

-- =================================================================
-- KABAB (14 items - with portion variants)
-- =================================================================
(get_cat_id('Kabab'), 'Soti Kabab (1:2)', null, 450, 'BDT', true, false, 1, '{}'),
(get_cat_id('Kabab'), 'Beef Shik Kabab (1:2)', null, 420, 'BDT', true, false, 2, '{}'),
(get_cat_id('Kabab'), 'Harharu/Hariyati Kabab (1:2)', null, 480, 'BDT', true, false, 1, '{"vegetarian"}'),
(get_cat_id('Kabab'), 'Reshmi Kabab (1:2)', null, 480, 'BDT', true, false, 1, '{}'),
(get_cat_id('Kabab'), 'Mutton Boti Kabab (1:2)', null, 550, 'BDT', true, false, 2, '{}'),
(get_cat_id('Kabab'), 'Mutton Chap (1:2)', null, 450, 'BDT', true, false, 2, '{}'),
(get_cat_id('Kabab'), 'Beef Chap (1:2)', null, 420, 'BDT', true, false, 2, '{}'),
(get_cat_id('Kabab'), 'Chicken Chap (1:2)', null, 350, 'BDT', true, false, 1, '{}'),
(get_cat_id('Kabab'), 'Chicken Chap (1:1)', null, 180, 'BDT', true, false, 1, '{}'),
(get_cat_id('Kabab'), 'Chicken Tandoori (1:2)', null, 400, 'BDT', true, false, 2, '{}'),
(get_cat_id('Kabab'), 'Chicken Tandoori (1:1)', null, 220, 'BDT', true, false, 2, '{}'),
(get_cat_id('Kabab'), 'Chicken Grill (1:1)', null, 280, 'BDT', true, false, 0, '{}'),
(get_cat_id('Kabab'), 'Chicken Grill (1:2)', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('Kabab'), 'Chicken Grill (1:4)', null, 520, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- NUN BON (4 items)
-- =================================================================
(get_cat_id('Nun Bon'), 'Butter Nun', null, 35, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('Nun Bon'), 'Garlic Nun', null, 60, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('Nun Bon'), 'Kashmiri Nun', null, 120, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('Nun Bon'), 'Star Sp Nun', null, 100, 'BDT', true, false, 0, '{"vegetarian"}'),

-- =================================================================
-- PIZZA (20 items - 6 pizzas × 3 sizes + 2 toppings)
-- =================================================================
-- Chicken Cheese Pizza
(get_cat_id('Pizza'), 'Chicken Cheese Pizza 8"', null, 420, 'BDT', true, false, 0, '{}'),
(get_cat_id('Pizza'), 'Chicken Cheese Pizza 10"', null, 580, 'BDT', true, false, 0, '{}'),
(get_cat_id('Pizza'), 'Chicken Cheese Pizza 12"', null, 780, 'BDT', true, false, 0, '{}'),

-- Mexican Hot Pizza
(get_cat_id('Pizza'), 'Mexican Hot Pizza 8"', null, 480, 'BDT', true, false, 2, '{}'),
(get_cat_id('Pizza'), 'Mexican Hot Pizza 10"', null, 680, 'BDT', true, false, 2, '{}'),
(get_cat_id('Pizza'), 'Mexican Hot Pizza 12"', null, 860, 'BDT', true, false, 2, '{}'),

-- BBQ Chicken Pizza
(get_cat_id('Pizza'), 'BBQ Chicken Pizza 8"', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('Pizza'), 'BBQ Chicken Pizza 10"', null, 650, 'BDT', true, false, 0, '{}'),
(get_cat_id('Pizza'), 'BBQ Chicken Pizza 12"', null, 880, 'BDT', true, false, 0, '{}'),

-- Meat Masala Pizza
(get_cat_id('Pizza'), 'Meat Masala Pizza 8"', null, 470, 'BDT', true, false, 1, '{}'),
(get_cat_id('Pizza'), 'Meat Masala Pizza 10"', null, 650, 'BDT', true, false, 1, '{}'),
(get_cat_id('Pizza'), 'Meat Masala Pizza 12"', null, 890, 'BDT', true, false, 1, '{}'),

-- Naga Chicken Pizza
(get_cat_id('Pizza'), 'Naga Chicken Pizza 8"', null, 450, 'BDT', true, false, 3, '{}'),
(get_cat_id('Pizza'), 'Naga Chicken Pizza 10"', null, 650, 'BDT', true, false, 3, '{}'),
(get_cat_id('Pizza'), 'Naga Chicken Pizza 12"', null, 850, 'BDT', true, false, 3, '{}'),

-- Beef Pan Pizza
(get_cat_id('Pizza'), 'Beef Pan Pizza 8"', null, 580, 'BDT', true, false, 0, '{}'),
(get_cat_id('Pizza'), 'Beef Pan Pizza 10"', null, 780, 'BDT', true, false, 0, '{}'),
(get_cat_id('Pizza'), 'Beef Pan Pizza 12"', null, 890, 'BDT', true, false, 0, '{}'),

-- Extra Toppings
(get_cat_id('Pizza'), 'Extra Topping (Cheese/Chicken)', null, 120, 'BDT', true, false, 0, '{}'),
(get_cat_id('Pizza'), 'Extra Topping (Sauce & Mayonnaise)', null, 30, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- BURGER (5 items)
-- =================================================================
(get_cat_id('Burger'), 'S.P Crispy Chicken Burger', null, 220, 'BDT', true, false, 0, '{}'),
(get_cat_id('Burger'), 'S.P Chicken Cheese Burger', null, 260, 'BDT', true, false, 0, '{}'),
(get_cat_id('Burger'), 'Naga Burger', null, 280, 'BDT', true, false, 3, '{}'),
(get_cat_id('Burger'), 'S.P Crispy Beef Burger', null, 280, 'BDT', true, false, 0, '{}'),
(get_cat_id('Burger'), 'S.P Beef Cheese Burger', null, 280, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- VEGETABLE (7 items)
-- =================================================================
(get_cat_id('VEGETABLE'), 'Star Sp. Vegetable (1:3)', null, 400, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('VEGETABLE'), 'Thai Vegetable (1:3)', null, 350, 'BDT', true, false, 1, '{"vegetarian","vegan"}'),
(get_cat_id('VEGETABLE'), 'Chicken Vegetable (1:3)', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('VEGETABLE'), 'Mixed Vegetable (1:2)', null, 250, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('VEGETABLE'), 'Prawn Vegetable (1:3)', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('VEGETABLE'), 'Chinese Vegetable (1:3)', null, 300, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('VEGETABLE'), 'Indian Style Dry Vegetable (1:3)', null, 350, 'BDT', true, false, 2, '{"vegetarian","vegan"}'),

-- =================================================================
-- SALAD (10 items)
-- =================================================================
(get_cat_id('SALAD'), 'Star Sp. Cashew Nut Salad (1:3)', null, 500, 'BDT', true, true, 0, '{"vegetarian"}'),
(get_cat_id('SALAD'), 'Cashew Nut Salad (Regular) (1:3)', null, 450, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('SALAD'), 'Vegetable Cashew Nut Salad (1:3)', null, 450, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('SALAD'), 'Prawn Salad (1:3)', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('SALAD'), 'Fruit Salad (1:3)', null, 400, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('SALAD'), 'Chicken Salad + Nun (1:3)', null, 550, 'BDT', true, false, 0, '{}'),
(get_cat_id('SALAD'), 'Sichuan Salad (1:3)', null, 500, 'BDT', true, false, 2, '{}'),
(get_cat_id('SALAD'), 'Russian Salad (1:3)', null, 500, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('SALAD'), 'Mixed Green Salad + Nun (1:3)', null, 300, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('SALAD'), 'Grill Salad + Nun (1:3)', null, 480, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- APPETIZERS/SNACKS (22 items)
-- =================================================================
(get_cat_id('APPETIZERS/SNACKS'), 'Star Sp. Wonton Finger (8 pcs)', null, 300, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Star Sp. Nachos', null, 200, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Fish Finger (8 pcs)', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'French Fry', null, 200, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Spring Roll (Vegetable 8 pcs)', null, 250, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Spring Roll Chicken (8 pcs)', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Fish/Chicken/Prawn Ball', null, 400, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Chicken/Fish Cutlet', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Sichuan Fried Chicken (8 pcs)', null, 500, 'BDT', true, false, 2, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Spring Fried Chicken', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Bangkok Fried Chicken', null, 350, 'BDT', true, false, 1, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Crispy Chicken (4 pcs)', null, 300, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Chicken Shashlik', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Beef Shashlik', null, 200, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Prawn Fry (8 pcs)', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Pomfret Fish Fry (1 pc)', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Vegetable Pakora', null, 250, 'BDT', true, false, 1, '{"vegetarian","vegan"}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Chicken Pakora', null, 300, 'BDT', true, false, 1, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Fish Fillet (4 pcs)', null, 300, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Chicken Strips (4 pcs)', null, 300, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Nuggets (8 pcs)', null, 300, 'BDT', true, false, 0, '{}'),
(get_cat_id('APPETIZERS/SNACKS'), 'Meat Ball (8 pcs)', null, 350, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- SOUP (13 items)
-- =================================================================
(get_cat_id('SOUP'), 'Star Sp. Thai Soup (1:3)', null, 500, 'BDT', true, true, 0, '{}'),
(get_cat_id('SOUP'), 'Special Thai Soup (1:3)', null, 400, 'BDT', true, false, 0, '{}'),
(get_cat_id('SOUP'), 'Hot & Sour Soup (1:3)', null, 350, 'BDT', true, false, 2, '{}'),
(get_cat_id('SOUP'), 'Chicken Corn Soup (1:3)', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('SOUP'), 'Thai Clear Soup (1:3)', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('SOUP'), 'Vegetable Soup (1:3)', null, 350, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('SOUP'), 'Chicken Steam Soup (1:3)', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('SOUP'), 'Cream of Mushroom Soup (1 Cup)', null, 400, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('SOUP'), 'Cocktail Soup (1:3)', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('SOUP'), 'Chicken Vegetable Soup (1:3)', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('SOUP'), 'Corn Soup (1:2)', null, 250, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('SOUP'), 'Thai Clear Soup (1:2)', null, 320, 'BDT', true, false, 0, '{}'),
(get_cat_id('SOUP'), 'Fried Wonton (8 pcs)', null, 250, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- CHOWMEIN / PASTA / CHOP SUEY / RAMEN (17 items)
-- =================================================================
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Star Sp. Chowmein (1:3)', null, 550, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Vegetable Chowmein (1:3)', null, 350, 'BDT', true, false, 0, '{"vegetarian","vegan"}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Chicken Spicy Chowmein (1:3)', null, 450, 'BDT', true, false, 2, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Beef Chowmein (1:3)', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Prawn Chowmein (1:3)', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Pad Thai Chowmein', null, 450, 'BDT', true, false, 1, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Star Sp. Spaghetti', null, 400, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'American Chop Suey', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Star Sp. Ramen', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Star Sp. Pasta', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Chicken Cheese White Sauce Pasta', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Italian Shish Pasta', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Italian Pasta Lovers', null, 320, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Cream Pasta (1:1)', null, 170, 'BDT', true, false, 0, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Spicy Pasta (1:1)', null, 170, 'BDT', true, false, 2, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Naga Pasta (1:1)', null, 170, 'BDT', true, false, 3, '{}'),
(get_cat_id('Chowmein /Pasta Chop Suey/Ramen'), 'Spicy Chicken Momo (8 pcs)', null, 220, 'BDT', true, false, 2, '{}'),

-- =================================================================
-- CHICKEN (Main Courses) (13 items)
-- =================================================================
(get_cat_id('CHICKEN'), 'Chicken Fry (4 pcs)', null, 480, 'BDT', true, false, 0, '{}'),
(get_cat_id('CHICKEN'), 'Thai Fried Chicken (4 pcs)', null, 450, 'BDT', true, false, 1, '{}'),
(get_cat_id('CHICKEN'), 'Crispy Chicken (2 pcs)', null, 220, 'BDT', true, false, 0, '{}'),
(get_cat_id('CHICKEN'), 'Crispy Chicken (6 pcs)', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('CHICKEN'), 'Sweet & Sour Chicken Ball', null, 450, 'BDT', true, false, 0, '{}'),
(get_cat_id('CHICKEN'), 'Chicken Masala (1:3)', null, 450, 'BDT', true, false, 2, '{}'),
(get_cat_id('CHICKEN'), 'Chicken Acharya', null, 450, 'BDT', true, false, 3, '{}'),
(get_cat_id('CHICKEN'), 'Chicken Do-piazza', null, 450, 'BDT', true, false, 1, '{}'),
(get_cat_id('CHICKEN'), 'Lemon Chicken', null, 400, 'BDT', true, false, 0, '{}'),
(get_cat_id('CHICKEN'), 'Chicken Chili Onion', null, 500, 'BDT', true, false, 2, '{}'),
(get_cat_id('CHICKEN'), 'Chicken 65', null, 450, 'BDT', true, false, 3, '{}'),
(get_cat_id('CHICKEN'), 'Chicken Sizzling (1:3)', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('CHICKEN'), 'Chicken Garlic', null, 400, 'BDT', true, false, 0, '{}'),

-- =================================================================
-- NACHOS (5 items)
-- =================================================================
(get_cat_id('Nachos'), 'Star Sp Nachos', null, 350, 'BDT', true, false, 0, '{}'),
(get_cat_id('Nachos'), 'Chicken Nachos', null, 300, 'BDT', true, false, 0, '{}'),
(get_cat_id('Nachos'), 'Chicken Cheese Nachos', null, 320, 'BDT', true, false, 0, '{}'),
(get_cat_id('Nachos'), 'Cheese Vegetable Nachos', null, 350, 'BDT', true, false, 0, '{"vegetarian"}'),
(get_cat_id('Nachos'), 'Mexican Tower Nachos', null, 350, 'BDT', true, false, 1, '{}'),

-- =================================================================
-- SIZZLING (5 items)
-- =================================================================
(get_cat_id('SIZZLING'), 'Star Sp. Mixed Sizzling', null, 700, 'BDT', true, true, 0, '{}'),
(get_cat_id('SIZZLING'), 'Chicken Sizzling', null, 500, 'BDT', true, false, 0, '{}'),
(get_cat_id('SIZZLING'), 'Prawn Sizzling', null, 600, 'BDT', true, false, 0, '{}'),
(get_cat_id('SIZZLING'), 'Beef Sizzling', null, 550, 'BDT', true, false, 0, '{}'),
(get_cat_id('SIZZLING'), 'Mutton Sizzling', null, 600, 'BDT', true, false, 0, '{}');

-- Step 5: Set placeholder images (optional - using category-based placeholders)
DO $$
BEGIN
  RAISE NOTICE 'Setting placeholder images...';
END $$;

UPDATE menu_items
SET image_url = '/images/categories/' ||
  (SELECT slug FROM menu_categories WHERE id = category_id) || '.webp'
WHERE image_url IS NULL;

-- Step 6: Verify import
DO $$
DECLARE
  category_count INTEGER;
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO category_count FROM menu_categories;
  SELECT COUNT(*) INTO item_count FROM menu_items;

  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ STAR CAFÉ MENU IMPORT COMPLETE!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Categories imported: %', category_count;
  RAISE NOTICE 'Menu items imported: %', item_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Signature items marked:';
  RAISE NOTICE '  - Star Special Kacchi Biryani (Chinigura Rice)';
  RAISE NOTICE '  - Star Sp. Fried Rice';
  RAISE NOTICE '  - Star Sp. Cashew Nut Salad';
  RAISE NOTICE '  - Star Sp. Thai Soup';
  RAISE NOTICE '  - Star Sp. Mixed Sizzling';
  RAISE NOTICE '';
  RAISE NOTICE 'All items available: is_available = true';
  RAISE NOTICE 'Currency: BDT';
  RAISE NOTICE '=================================================';
END $$;

-- Drop helper function (cleanup)
DROP FUNCTION IF EXISTS get_cat_id(TEXT);
