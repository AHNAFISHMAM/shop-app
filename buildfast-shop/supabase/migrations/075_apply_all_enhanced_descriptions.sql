-- =====================================================
-- ENHANCED PROFESSIONAL MENU DESCRIPTIONS - BATCH 1
-- =====================================================
-- Premium items: Biryanis, Set Menus, and Featured Dishes
-- Following 2024 restaurant menu best practices:
-- - Sensory language (taste, aroma, texture)
-- - Cooking methods highlighted
-- - Origin/quality of ingredients
-- - Concise yet compelling (15-25 words)
-- - Positive, appetizing language
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✨ Enhancing menu descriptions - Batch 1 (Premium Items)...';
END $$;

-- =====================================================
-- STAR SPECIAL KACCHI BIRYANI (Signature Dish)
-- =====================================================
UPDATE menu_items SET
  description = 'Our signature slow-cooked kacchi biryani layered with fragrant chinigura rice, tender marinated meat, aromatic saffron, and house-blend spices. Served with jali kabab, tangy borhani, and fresh salad.',
  dietary_tags = ARRAY['halal', 'spicy', 'signature'],
  spice_level = 3,
  prep_time = 40,
  is_featured = true
WHERE name ILIKE '%star special kacchi biryani%';

-- =====================================================
-- KACCHI BIRYANI (Traditional)
-- =====================================================
UPDATE menu_items SET
  description = 'Traditional Dhaka-style kacchi biryani with premium basmati rice, slow-cooked spiced meat, caramelized onions, and authentic aromatic spices. A timeless Bengali favorite.',
  dietary_tags = ARRAY['halal', 'spicy'],
  spice_level = 3,
  prep_time = 35
WHERE name ILIKE '%kacchi biryani%' AND name NOT ILIKE '%star special%';

-- =====================================================
-- CHICKEN BIRYANI
-- =====================================================
UPDATE menu_items SET
  description = 'Succulent chicken pieces layered with golden basmati rice, fragrant whole spices, fresh herbs, and a hint of saffron. Perfectly balanced and flavorful.',
  dietary_tags = ARRAY['halal', 'popular'],
  spice_level = 2,
  prep_time = 30
WHERE name ILIKE '%chicken biryani%' AND name NOT ILIKE '%kacchi%';

-- =====================================================
-- BEEF BIRYANI
-- =====================================================
UPDATE menu_items SET
  description = 'Rich and hearty biryani featuring tender beef chunks marinated in yogurt and spices, cooked with aromatic basmati rice and topped with fried onions.',
  dietary_tags = ARRAY['halal', 'spicy'],
  spice_level = 3,
  prep_time = 35
WHERE name ILIKE '%beef biryani%' AND name NOT ILIKE '%kacchi%';

-- =====================================================
-- MUTTON BIRYANI
-- =====================================================
UPDATE menu_items SET
  description = 'Premium mutton biryani with melt-in-mouth tender meat, fragrant long-grain rice, warming spices, and a touch of rose water. A royal feast.',
  dietary_tags = ARRAY['halal', 'spicy', 'premium'],
  spice_level = 3,
  prep_time = 40
WHERE name ILIKE '%mutton biryani%' AND name NOT ILIKE '%kacchi%';

-- =====================================================
-- PACKAGE 01 (DINE IN)
-- =====================================================
UPDATE menu_items SET
  description = 'Complete dining experience: Golden fried rice, crispy fried chicken (2 pcs), stir-fried mixed vegetables, succulent fried prawns (2 pcs), soft drink, and mineral water.',
  dietary_tags = ARRAY['halal', 'set-meal'],
  spice_level = 1,
  prep_time = 25
WHERE name = 'Package 01 (Dine)';

-- =====================================================
-- PACKAGE 02 (DINE IN)
-- =====================================================
UPDATE menu_items SET
  description = 'Feast for two: Aromatic fried rice, crispy chicken (2 pcs), tender prawns (2 pcs), special chicken curry (2 pcs), garden vegetables, beverages. Perfect for sharing.',
  dietary_tags = ARRAY['halal', 'set-meal', 'sharing'],
  spice_level = 2,
  prep_time = 30
WHERE name = 'Package 02 (Dine)';

-- =====================================================
-- PACKAGE 03 (DINE IN)
-- =====================================================
UPDATE menu_items SET
  description = 'Trio special: Savory fried rice, golden fried chicken (2 pcs), colorful mixed vegetables, sizzling beef platter with smoky aroma, soft drink, and water.',
  dietary_tags = ARRAY['halal', 'set-meal', 'sizzling'],
  spice_level = 2,
  prep_time = 30
WHERE name = 'Package 03 (Dine)';

-- =====================================================
-- PACKAGE 04 (DINE IN) - Premium Set
-- =====================================================
UPDATE menu_items SET
  description = 'Ultimate dining package: Aromatic Thai soup, crispy wontons, fragrant fried rice, golden chicken (2 pcs), fresh vegetables, theatrical beef sizzling, and beverages.',
  dietary_tags = ARRAY['halal', 'set-meal', 'premium', 'sharing'],
  spice_level = 2,
  prep_time = 35,
  is_featured = true
WHERE name = 'Package 04 (Dine)';

-- =====================================================
-- PACKAGE 01 (TAKE AWAY)
-- =====================================================
UPDATE menu_items SET
  description = 'Convenient takeaway combo: Flavorful fried rice, crispy fried chicken (2 pcs), golden prawns (2 pcs), and fresh chicken vegetable stir-fry. Ready to enjoy at home.',
  dietary_tags = ARRAY['halal', 'takeaway'],
  spice_level = 1,
  prep_time = 20
WHERE name = 'Package 01 (Take Away)';

DO $$
BEGIN
  RAISE NOTICE '✅ Batch 1 complete: 10 premium items enhanced';
END $$;
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
  prep_time = 22
WHERE name ILIKE '%chicken cheese pizza%' OR name ILIKE '%chicken pizza%';

-- =====================================================
-- BBQ CHICKEN PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Smoky BBQ sauce base topped with charbroiled chicken, caramelized onions, bell peppers, and melted cheese. Sweet, tangy, and utterly satisfying.',
  dietary_tags = ARRAY['halal', 'bbq'],
  spice_level = 1,
  prep_time = 22
WHERE name ILIKE '%bbq%pizza%' OR name ILIKE '%barbeque%pizza%';

-- =====================================================
-- MEXICAN PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Fiesta on a crust! Spicy seasoned chicken, jalapeños, black olives, colorful bell peppers, zesty salsa, and melted cheese. Bold and flavorful.',
  dietary_tags = ARRAY['halal', 'spicy', 'fusion'],
  spice_level = 2,
  prep_time = 22
WHERE name ILIKE '%mexican%pizza%';

-- =====================================================
-- BEEF LOVER PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Carnivore''s delight! Generous portions of seasoned beef, beef pepperoni, Italian sausage, extra mozzarella, and rich tomato sauce on crispy crust.',
  dietary_tags = ARRAY['halal', 'meat-lovers'],
  spice_level = 1,
  prep_time = 24
WHERE name ILIKE '%beef%lover%' OR name ILIKE '%meat%lover%';

-- =====================================================
-- VEGETARIAN PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Garden-fresh medley of seasonal vegetables, mushrooms, bell peppers, onions, olives, juicy tomatoes, and mozzarella on hand-tossed crust. Light yet satisfying.',
  dietary_tags = ARRAY['vegetarian', 'healthy'],
  spice_level = 0,
  prep_time = 20
WHERE name ILIKE '%vegetarian%pizza%' OR name ILIKE '%veggie%pizza%';

-- =====================================================
-- BEEF BURGER
-- =====================================================
UPDATE menu_items SET
  description = 'Juicy flame-grilled beef patty, crisp lettuce, ripe tomatoes, crunchy pickles, melted cheese, and signature sauce in a toasted sesame bun. Classic perfection.',
  dietary_tags = ARRAY['halal', 'popular'],
  spice_level = 0,
  prep_time = 15
WHERE name ILIKE '%beef burger%' AND name NOT ILIKE '%cheese%';

-- =====================================================
-- CHICKEN BURGER
-- =====================================================
UPDATE menu_items SET
  description = 'Tender grilled chicken breast, fresh lettuce, juicy tomatoes, creamy mayo, and crispy onions in a soft toasted bun. Light, satisfying, and delicious.',
  dietary_tags = ARRAY['halal', 'popular'],
  spice_level = 0,
  prep_time = 15
WHERE name ILIKE '%chicken burger%' AND name NOT ILIKE '%cheese%';

-- =====================================================
-- CHEESE BURGER
-- =====================================================
UPDATE menu_items SET
  description = 'All-American classic: Flame-grilled beef patty, melted cheddar cheese, tangy pickles, crisp onions, and special house sauce in a pillowy bun.',
  dietary_tags = ARRAY['halal', 'classic'],
  spice_level = 0,
  prep_time = 15
WHERE name ILIKE '%cheese%burger%' AND name NOT ILIKE '%chicken%' AND name NOT ILIKE '%beef cheese%';

-- =====================================================
-- SPECIAL GOURMET PIZZA
-- =====================================================
UPDATE menu_items SET
  description = 'Chef''s signature creation with premium toppings, artisan cheese blend, sun-dried tomatoes, fresh basil, and truffle-infused olive oil. Elevated pizza experience.',
  dietary_tags = ARRAY['halal', 'premium', 'signature'],
  spice_level = 0,
  prep_time = 25,
  is_featured = true
WHERE name ILIKE '%special%gourmet%' OR (name ILIKE '%gourmet%' AND name ILIKE '%pizza%');

-- =====================================================
-- DOUBLE CHEESE BURGER
-- =====================================================
UPDATE menu_items SET
  description = 'Indulgent double-decker with two flame-grilled patties, double American cheese, crispy bacon, special sauce, lettuce, and tomatoes. Pure satisfaction.',
  dietary_tags = ARRAY['halal', 'indulgent'],
  spice_level = 0,
  prep_time = 18
WHERE name ILIKE '%double%cheese%burger%' OR name ILIKE '%double%burger%';

DO $$
BEGIN
  RAISE NOTICE '✅ Batch 2 complete: 10 pizza & burger items enhanced';
END $$;
-- =====================================================
-- ENHANCED PROFESSIONAL MENU DESCRIPTIONS - BATCH 3
-- =====================================================
-- Appetizers, Soups, Kababs, and Sides
-- Focusing on sensory appeal and preparation methods
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✨ Enhancing menu descriptions - Batch 3 (Appetizers & Starters)...';
END $$;

-- =====================================================
-- THAI SOUP
-- =====================================================
UPDATE menu_items SET
  description = 'Aromatic Thai-style hot and sour soup with lemongrass, galangal, kaffir lime, tender chicken, and fresh vegetables. Warming and invigorating.',
  dietary_tags = ARRAY['halal', 'spicy', 'thai'],
  spice_level = 2,
  prep_time = 15
WHERE name ILIKE '%thai soup%';

-- =====================================================
-- CHICKEN SOUP / CORN SOUP
-- =====================================================
UPDATE menu_items SET
  description = 'Comforting homestyle chicken soup with tender shredded chicken, sweet corn kernels, vegetables, and aromatic herbs. Warm and nourishing.',
  dietary_tags = ARRAY['halal', 'comfort-food'],
  spice_level = 0,
  prep_time = 12
WHERE name ILIKE '%chicken soup%' OR name ILIKE '%corn soup%';

-- =====================================================
-- VEGETABLE SOUP
-- =====================================================
UPDATE menu_items SET
  description = 'Garden-fresh mixed vegetable soup with seasonal vegetables, herbs, and light broth. Healthy, wholesome, and satisfying.',
  dietary_tags = ARRAY['vegetarian', 'healthy', 'vegan'],
  spice_level = 0,
  prep_time = 12
WHERE name ILIKE '%vegetable soup%' AND name NOT ILIKE '%chicken%';

-- =====================================================
-- CHICKEN SHISH KABAB / SEEKH KABAB
-- =====================================================
UPDATE menu_items SET
  description = 'Charcoal-grilled minced chicken skewers infused with aromatic spices, fresh herbs, and traditional masala. Smoky, juicy, and flavorful.',
  dietary_tags = ARRAY['halal', 'grilled', 'protein'],
  spice_level = 2,
  prep_time = 20
WHERE name ILIKE '%chicken%shish%' OR name ILIKE '%chicken%seekh%' OR name ILIKE '%chicken%kabab%';

-- =====================================================
-- BEEF SHISH KABAB / SEEKH KABAB
-- =====================================================
UPDATE menu_items SET
  description = 'Fire-grilled beef kabab seasoned with cumin, coriander, ginger, and fresh herbs. Succulent, smoky, and authentically spiced.',
  dietary_tags = ARRAY['halal', 'grilled', 'protein'],
  spice_level = 2,
  prep_time = 22
WHERE name ILIKE '%beef%shish%' OR (name ILIKE '%beef%' AND name ILIKE '%seekh%');

-- =====================================================
-- JALI KABAB (Traditional Bengali)
-- =====================================================
UPDATE menu_items SET
  description = 'Traditional Bengali-style minced meat kabab delicately spiced, wrapped in caul fat, and grilled to perfection. Tender, aromatic, and authentic.',
  dietary_tags = ARRAY['halal', 'grilled', 'traditional'],
  spice_level = 2,
  prep_time = 25
WHERE name ILIKE '%jali kabab%';

-- =====================================================
-- SPRING ROLLS
-- =====================================================
UPDATE menu_items SET
  description = 'Crispy golden spring rolls filled with seasoned vegetables and glass noodles. Served with sweet chili dipping sauce. Light and crunchy.',
  dietary_tags = ARRAY['vegetarian', 'crispy'],
  spice_level = 0,
  prep_time = 10
WHERE name ILIKE '%spring roll%';

-- =====================================================
-- FRIED WONTON
-- =====================================================
UPDATE menu_items SET
  description = 'Delicate wontons filled with seasoned minced chicken, deep-fried until golden and crispy. Served with tangy sweet and sour sauce.',
  dietary_tags = ARRAY['halal', 'crispy', 'appetizer'],
  spice_level = 0,
  prep_time = 12
WHERE name ILIKE '%fried wonton%' OR name ILIKE '%wonton%';

-- =====================================================
-- FRENCH FRIES
-- =====================================================
UPDATE menu_items SET
  description = 'Thick-cut golden French fries, perfectly crispy outside and fluffy inside. Seasoned with sea salt. Classic comfort food.',
  dietary_tags = ARRAY['vegetarian', 'crispy', 'side'],
  spice_level = 0,
  prep_time = 10
WHERE name ILIKE '%french fries%' OR name = 'Fries';

-- =====================================================
-- GREEN SALAD
-- =====================================================
UPDATE menu_items SET
  description = 'Crisp mixed greens, cherry tomatoes, cucumber slices, shredded carrots, and red onion with choice of dressing. Fresh and refreshing.',
  dietary_tags = ARRAY['vegetarian', 'healthy', 'vegan', 'fresh'],
  spice_level = 0,
  prep_time = 8
WHERE name ILIKE '%green salad%' OR (name ILIKE '%salad%' AND category_id IN (SELECT id FROM menu_categories WHERE name = 'SALAD'));

DO $$
BEGIN
  RAISE NOTICE '✅ Batch 3 complete: 10 appetizer & starter items enhanced';
END $$;
