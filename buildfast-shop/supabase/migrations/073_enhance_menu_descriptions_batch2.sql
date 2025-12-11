-- =====================================================
-- ENHANCED PROFESSIONAL MENU DESCRIPTIONS - BATCH 2
-- =====================================================
-- Pizzas & Burgers - Popular Items
-- Using appetizing descriptors and highlighting cooking methods
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✨ Enhancing menu descriptions - Batch 2 (Pizzas & Burgers)...';
END $$;

-- =====================================================
-- CHICKEN CHEESE PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Wood-fired thin crust loaded with tender grilled chicken, creamy mozzarella cheese, tangy tomato sauce, and fresh herbs. Crispy edges, gooey center.',
  dietary_tags = ARRAY['halal', 'popular'],
  spice_level = 0,
  prep_time = 22,
  currency = 'BDT'
WHERE name ILIKE '%chicken cheese pizza%' OR name ILIKE '%chicken pizza%';

-- =====================================================
-- BBQ CHICKEN PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Smoky BBQ sauce base topped with charbroiled chicken, caramelized onions, bell peppers, and melted cheese. Sweet, tangy, and utterly satisfying.',
  dietary_tags = ARRAY['halal', 'bbq'],
  spice_level = 1,
  prep_time = 22,
  currency = 'BDT'
WHERE name ILIKE '%bbq%pizza%' OR name ILIKE '%barbeque%pizza%';

-- =====================================================
-- MEXICAN PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Fiesta on a crust! Spicy seasoned chicken, jalapeños, black olives, colorful bell peppers, zesty salsa, and melted cheese. Bold and flavorful.',
  dietary_tags = ARRAY['halal', 'spicy', 'fusion'],
  spice_level = 2,
  prep_time = 22,
  currency = 'BDT'
WHERE name ILIKE '%mexican%pizza%';

-- =====================================================
-- BEEF LOVER PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Carnivore''s delight! Generous portions of seasoned beef, beef pepperoni, Italian sausage, extra mozzarella, and rich tomato sauce on crispy crust.',
  dietary_tags = ARRAY['halal', 'meat-lovers'],
  spice_level = 1,
  prep_time = 24,
  currency = 'BDT'
WHERE name ILIKE '%beef%lover%' OR name ILIKE '%meat%lover%';

-- =====================================================
-- VEGETARIAN PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Garden-fresh medley of seasonal vegetables, mushrooms, bell peppers, onions, olives, juicy tomatoes, and mozzarella on hand-tossed crust. Light yet satisfying.',
  dietary_tags = ARRAY['vegetarian', 'healthy'],
  spice_level = 0,
  prep_time = 20,
  currency = 'BDT'
WHERE name ILIKE '%vegetarian%pizza%' OR name ILIKE '%veggie%pizza%';

-- =====================================================
-- BEEF BURGER
-- =====================================================
UPDATE menu_items SET
  description = 'Juicy flame-grilled beef patty, crisp lettuce, ripe tomatoes, crunchy pickles, melted cheese, and signature sauce in a toasted sesame bun. Classic perfection.',
  dietary_tags = ARRAY['halal', 'popular'],
  spice_level = 0,
  prep_time = 15,
  currency = 'BDT'
WHERE name ILIKE '%beef burger%' AND name NOT ILIKE '%cheese%';

-- =====================================================
-- CHICKEN BURGER
-- =====================================================
UPDATE menu_items SET
  description = 'Tender grilled chicken breast, fresh lettuce, juicy tomatoes, creamy mayo, and crispy onions in a soft toasted bun. Light, satisfying, and delicious.',
  dietary_tags = ARRAY['halal', 'popular'],
  spice_level = 0,
  prep_time = 15,
  currency = 'BDT'
WHERE name ILIKE '%chicken burger%' AND name NOT ILIKE '%cheese%';

-- =====================================================
-- CHEESE BURGER
-- =====================================================
UPDATE menu_items SET
  description = 'All-American classic: Flame-grilled beef patty, melted cheddar cheese, tangy pickles, crisp onions, and special house sauce in a pillowy bun.',
  dietary_tags = ARRAY['halal', 'classic'],
  spice_level = 0,
  prep_time = 15,
  currency = 'BDT'
WHERE name ILIKE '%cheese%burger%' AND name NOT ILIKE '%chicken%' AND name NOT ILIKE '%beef cheese%';

-- =====================================================
-- SPECIAL GOURMET PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Chef''s signature creation with premium toppings, artisan cheese blend, sun-dried tomatoes, fresh basil, and truffle-infused olive oil. Elevated pizza experience.',
  dietary_tags = ARRAY['halal', 'premium', 'signature'],
  spice_level = 0,
  prep_time = 25,
  is_featured = true,
  currency = 'BDT'
WHERE name ILIKE '%special%gourmet%' OR (name ILIKE '%gourmet%' AND name ILIKE '%pizza%');

-- =====================================================
-- DOUBLE CHEESE BURGER
-- =====================================================
UPDATE menu_items SET
  description = 'Indulgent double-decker with two flame-grilled patties, double American cheese, crispy bacon, special sauce, lettuce, and tomatoes. Pure satisfaction.',
  dietary_tags = ARRAY['halal', 'indulgent'],
  spice_level = 0,
  prep_time = 18,
  currency = 'BDT'
WHERE name ILIKE '%double%cheese%burger%' OR name ILIKE '%double%burger%';

DO $$
BEGIN
  RAISE NOTICE '✅ Batch 2 complete: 10 pizza & burger items enhanced';
END $$;
