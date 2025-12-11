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
  prep_time = 15,
  currency = 'BDT'
WHERE name ILIKE '%thai soup%';

-- =====================================================
-- CHICKEN SOUP / CORN SOUP
-- =====================================================
UPDATE menu_items SET
  description = 'Comforting homestyle chicken soup with tender shredded chicken, sweet corn kernels, vegetables, and aromatic herbs. Warm and nourishing.',
  dietary_tags = ARRAY['halal', 'comfort-food'],
  spice_level = 0,
  prep_time = 12,
  currency = 'BDT'
WHERE name ILIKE '%chicken soup%' OR name ILIKE '%corn soup%';

-- =====================================================
-- VEGETABLE SOUP
-- =====================================================
UPDATE menu_items SET
  description = 'Garden-fresh mixed vegetable soup with seasonal vegetables, herbs, and light broth. Healthy, wholesome, and satisfying.',
  dietary_tags = ARRAY['vegetarian', 'healthy', 'vegan'],
  spice_level = 0,
  prep_time = 12,
  currency = 'BDT'
WHERE name ILIKE '%vegetable soup%' AND name NOT ILIKE '%chicken%';

-- =====================================================
-- CHICKEN SHISH KABAB / SEEKH KABAB
-- =====================================================
UPDATE menu_items SET
  description = 'Charcoal-grilled minced chicken skewers infused with aromatic spices, fresh herbs, and traditional masala. Smoky, juicy, and flavorful.',
  dietary_tags = ARRAY['halal', 'grilled', 'protein'],
  spice_level = 2,
  prep_time = 20,
  currency = 'BDT'
WHERE name ILIKE '%chicken%shish%' OR name ILIKE '%chicken%seekh%' OR name ILIKE '%chicken%kabab%';

-- =====================================================
-- BEEF SHISH KABAB / SEEKH KABAB
-- =====================================================
UPDATE menu_items SET
  description = 'Fire-grilled beef kabab seasoned with cumin, coriander, ginger, and fresh herbs. Succulent, smoky, and authentically spiced.',
  dietary_tags = ARRAY['halal', 'grilled', 'protein'],
  spice_level = 2,
  prep_time = 22,
  currency = 'BDT'
WHERE name ILIKE '%beef%shish%' OR (name ILIKE '%beef%' AND name ILIKE '%seekh%');

-- =====================================================
-- JALI KABAB (Traditional Bengali)
-- =====================================================
UPDATE menu_items SET
  description = 'Traditional Bengali-style minced meat kabab delicately spiced, wrapped in caul fat, and grilled to perfection. Tender, aromatic, and authentic.',
  dietary_tags = ARRAY['halal', 'grilled', 'traditional'],
  spice_level = 2,
  prep_time = 25,
  currency = 'BDT'
WHERE name ILIKE '%jali kabab%';

-- =====================================================
-- SPRING ROLLS
-- =====================================================
UPDATE menu_items SET
  description = 'Crispy golden spring rolls filled with seasoned vegetables and glass noodles. Served with sweet chili dipping sauce. Light and crunchy.',
  dietary_tags = ARRAY['vegetarian', 'crispy'],
  spice_level = 0,
  prep_time = 10,
  currency = 'BDT'
WHERE name ILIKE '%spring roll%';

-- =====================================================
-- FRIED WONTON
-- =====================================================
UPDATE menu_items SET
  description = 'Delicate wontons filled with seasoned minced chicken, deep-fried until golden and crispy. Served with tangy sweet and sour sauce.',
  dietary_tags = ARRAY['halal', 'crispy', 'appetizer'],
  spice_level = 0,
  prep_time = 12,
  currency = 'BDT'
WHERE name ILIKE '%fried wonton%' OR name ILIKE '%wonton%';

-- =====================================================
-- FRENCH FRIES
-- =====================================================
UPDATE menu_items SET
  description = 'Thick-cut golden French fries, perfectly crispy outside and fluffy inside. Seasoned with sea salt. Classic comfort food.',
  dietary_tags = ARRAY['vegetarian', 'crispy', 'side'],
  spice_level = 0,
  prep_time = 10,
  currency = 'BDT'
WHERE name ILIKE '%french fries%' OR name = 'Fries';

-- =====================================================
-- GREEN SALAD
-- =====================================================
UPDATE menu_items SET
  description = 'Crisp mixed greens, cherry tomatoes, cucumber slices, shredded carrots, and red onion with choice of dressing. Fresh and refreshing.',
  dietary_tags = ARRAY['vegetarian', 'healthy', 'vegan', 'fresh'],
  spice_level = 0,
  prep_time = 8,
  currency = 'BDT'
WHERE name ILIKE '%green salad%' OR (name ILIKE '%salad%' AND category_id IN (SELECT id FROM menu_categories WHERE name = 'SALAD'));

DO $$
BEGIN
  RAISE NOTICE '✅ Batch 3 complete: 10 appetizer & starter items enhanced';
END $$;
