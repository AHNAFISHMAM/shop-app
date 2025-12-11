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
  is_featured = true,
  currency = 'BDT'
WHERE name ILIKE '%star special kacchi biryani%';

-- =====================================================
-- KACCHI BIRYANI (Traditional)
-- =====================================================
UPDATE menu_items SET
  description = 'Traditional Dhaka-style kacchi biryani with premium basmati rice, slow-cooked spiced meat, caramelized onions, and authentic aromatic spices. A timeless Bengali favorite.',
  dietary_tags = ARRAY['halal', 'spicy'],
  spice_level = 3,
  prep_time = 35,
  currency = 'BDT'
WHERE name ILIKE '%kacchi biryani%' AND name NOT ILIKE '%star special%';

-- =====================================================
-- CHICKEN BIRYANI
-- =====================================================
UPDATE menu_items SET
  description = 'Succulent chicken pieces layered with golden basmati rice, fragrant whole spices, fresh herbs, and a hint of saffron. Perfectly balanced and flavorful.',
  dietary_tags = ARRAY['halal', 'popular'],
  spice_level = 2,
  prep_time = 30,
  currency = 'BDT'
WHERE name ILIKE '%chicken biryani%' AND name NOT ILIKE '%kacchi%';

-- =====================================================
-- BEEF BIRYANI
-- =====================================================
UPDATE menu_items SET
  description = 'Rich and hearty biryani featuring tender beef chunks marinated in yogurt and spices, cooked with aromatic basmati rice and topped with fried onions.',
  dietary_tags = ARRAY['halal', 'spicy'],
  spice_level = 3,
  prep_time = 35,
  currency = 'BDT'
WHERE name ILIKE '%beef biryani%' AND name NOT ILIKE '%kacchi%';

-- =====================================================
-- MUTTON BIRYANI
-- =====================================================
UPDATE menu_items SET
  description = 'Premium mutton biryani with melt-in-mouth tender meat, fragrant long-grain rice, warming spices, and a touch of rose water. A royal feast.',
  dietary_tags = ARRAY['halal', 'spicy', 'premium'],
  spice_level = 3,
  prep_time = 40,
  currency = 'BDT'
WHERE name ILIKE '%mutton biryani%' AND name NOT ILIKE '%kacchi%';

-- =====================================================
-- PACKAGE 01 (DINE IN)
-- =====================================================
UPDATE menu_items SET
  description = 'Complete dining experience: Golden fried rice, crispy fried chicken (2 pcs), stir-fried mixed vegetables, succulent fried prawns (2 pcs), soft drink, and mineral water.',
  dietary_tags = ARRAY['halal', 'set-meal'],
  spice_level = 1,
  prep_time = 25,
  currency = 'BDT'
WHERE name = 'Package 01 (Dine)';

-- =====================================================
-- PACKAGE 02 (DINE IN)
-- =====================================================
UPDATE menu_items SET
  description = 'Feast for two: Aromatic fried rice, crispy chicken (2 pcs), tender prawns (2 pcs), special chicken curry (2 pcs), garden vegetables, beverages. Perfect for sharing.',
  dietary_tags = ARRAY['halal', 'set-meal', 'sharing'],
  spice_level = 2,
  prep_time = 30,
  currency = 'BDT'
WHERE name = 'Package 02 (Dine)';

-- =====================================================
-- PACKAGE 03 (DINE IN)
-- =====================================================
UPDATE menu_items SET
  description = 'Trio special: Savory fried rice, golden fried chicken (2 pcs), colorful mixed vegetables, sizzling beef platter with smoky aroma, soft drink, and water.',
  dietary_tags = ARRAY['halal', 'set-meal', 'sizzling'],
  spice_level = 2,
  prep_time = 30,
  currency = 'BDT'
WHERE name = 'Package 03 (Dine)';

-- =====================================================
-- PACKAGE 04 (DINE IN) - Premium Set
-- =====================================================
UPDATE menu_items SET
  description = 'Ultimate dining package: Aromatic Thai soup, crispy wontons, fragrant fried rice, golden chicken (2 pcs), fresh vegetables, theatrical beef sizzling, and beverages.',
  dietary_tags = ARRAY['halal', 'set-meal', 'premium', 'sharing'],
  spice_level = 2,
  prep_time = 35,
  is_featured = true,
  currency = 'BDT'
WHERE name = 'Package 04 (Dine)';

-- =====================================================
-- PACKAGE 01 (TAKE AWAY)
-- =====================================================
UPDATE menu_items SET
  description = 'Convenient takeaway combo: Flavorful fried rice, crispy fried chicken (2 pcs), golden prawns (2 pcs), and fresh chicken vegetable stir-fry. Ready to enjoy at home.',
  dietary_tags = ARRAY['halal', 'takeaway'],
  spice_level = 1,
  prep_time = 20,
  currency = 'BDT'
WHERE name = 'Package 01 (Take Away)';

DO $$
BEGIN
  RAISE NOTICE '✅ Batch 1 complete: 10 premium items enhanced';
END $$;
