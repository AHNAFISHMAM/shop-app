-- =====================================================
-- STAR CAFÉ MENU SYSTEM - MIGRATION 050
-- =====================================================
-- Creates new menu_categories and menu_items tables
-- Soft deletes existing dishes to preserve order history
-- Seeds complete Star Café menu (100+ authentic dishes)
-- =====================================================

-- =====================================================
-- 1. CREATE MENU_CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_menu_categories_slug ON menu_categories(slug);
CREATE INDEX idx_menu_categories_sort_order ON menu_categories(sort_order);

-- =====================================================
-- 2. CREATE MENU_ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'BDT',

  -- Images
  image_url TEXT,
  placeholder_color TEXT DEFAULT '#C59D5F',

  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Special Sections (for Order page)
  is_todays_menu BOOLEAN DEFAULT FALSE,
  is_daily_special BOOLEAN DEFAULT FALSE,
  is_new_dish BOOLEAN DEFAULT FALSE,
  is_discount_combo BOOLEAN DEFAULT FALSE,
  is_limited_time BOOLEAN DEFAULT FALSE,
  is_happy_hour BOOLEAN DEFAULT FALSE,

  -- Restaurant-specific fields
  dietary_tags TEXT[] DEFAULT '{}',
  spice_level INTEGER DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 3),
  prep_time INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_featured ON menu_items(is_featured);
CREATE INDEX idx_menu_items_dietary ON menu_items USING GIN(dietary_tags);

-- =====================================================
-- 3. SOFT DELETE EXISTING DISHES (PRESERVE ORDER HISTORY)
-- =====================================================

-- Add deleted_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE dishes ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Soft delete all existing dishes
UPDATE dishes
SET is_active = FALSE,
    deleted_at = NOW()
WHERE deleted_at IS NULL;

-- =====================================================
-- 4. SEED MENU CATEGORIES
-- =====================================================

INSERT INTO menu_categories (name, slug, description, sort_order) VALUES
  ('Set Menu (Dine In)', 'set-menu-dine', 'Complete meal packages for dining in', 1),
  ('Set Menu (Take Away)', 'set-menu-takeaway', 'Complete meal packages to go', 2),
  ('Biryani Items', 'biryani', 'Authentic biryanis, polao, and tehari', 3),
  ('Bangla Menu', 'bangla-menu', 'Traditional Bengali cuisine', 4),
  ('Beef (Goru)', 'beef', 'Beef curries and specialties', 5),
  ('Mutton (Khasi)', 'mutton', 'Mutton curries and delicacies', 6),
  ('Chicken / Sonali Chicken', 'chicken', 'Chicken dishes and preparations', 7),
  ('Prawn & Fish', 'prawn-fish', 'Seafood specialties', 8),
  ('Kabab', 'kabab', 'Grilled kababs and BBQ', 9),
  ('Naan (Nun Bon)', 'naan', 'Fresh baked breads', 10),
  ('Rice', 'rice', 'Fried rice and steamed rice varieties', 11),
  ('Pizza', 'pizza', 'Wood-fired pizzas', 12),
  ('Burger', 'burger', 'Gourmet burgers', 13),
  ('Soup', 'soup', 'Hot soups and broths', 14),
  ('Chowmein / Pasta / Ramen', 'chowmein-pasta', 'Noodles and pasta dishes', 15),
  ('Appetizers & Snacks', 'appetizers-snacks', 'Starters and finger foods', 16),
  ('Nachos', 'nachos', 'Loaded nachos', 17),
  ('Sizzling', 'sizzling', 'Hot sizzling platters', 18),
  ('Vegetable', 'vegetable', 'Vegetarian dishes', 19),
  ('Salad', 'salad', 'Fresh salads', 20)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 5. SEED MENU ITEMS - STAR CAFÉ COMPLETE MENU
-- =====================================================

-- Helper function to get category ID by slug
CREATE OR REPLACE FUNCTION get_category_id(category_slug TEXT)
RETURNS UUID AS $$
  SELECT id FROM menu_categories WHERE slug = category_slug LIMIT 1;
$$ LANGUAGE SQL;

-- =====================================================
-- SET MENU (DINE IN)
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, dietary_tags, prep_time) VALUES
  (get_category_id('set-menu-dine'), 'Set Menu Dine Package 01', 'Fried rice, 2 pcs fried chicken, mixed vegetables, 2 pcs fried prawn, soft drink, 500ml mineral water.', 450, '/images/menu/set-dine-1.webp', TRUE, '{}', 30),
  (get_category_id('set-menu-dine'), 'Set Menu Dine Package 02', 'Fried rice, 2 pcs fried chicken, mixed vegetables, 2 pcs fried prawn, 2 pcs special chicken curry, soft drink, 500ml mineral water. (Min 2 persons)', 550, '/images/menu/set-dine-2.webp', FALSE, '{}', 35),
  (get_category_id('set-menu-dine'), 'Set Menu Dine Package 03', 'Fried rice, 2 pcs fried chicken, mixed vegetables, special beef sizzling, soft drink, 500ml mineral water. (Min 3 persons)', 590, '/images/menu/set-dine-3.webp', FALSE, '{}', 40),
  (get_category_id('set-menu-dine'), 'Set Menu Dine Package 04', 'Thai soup, fried wonton, fried rice, 2 pcs fried chicken, mixed vegetables, beef sizzling, soft drink, 500ml mineral water.', 680, '/images/menu/set-dine-4.webp', FALSE, '{}', 45);

-- =====================================================
-- SET MENU (TAKE AWAY)
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, dietary_tags, prep_time) VALUES
  (get_category_id('set-menu-takeaway'), 'Set Menu Takeaway Package 01', 'Fried rice, 2 pcs fried chicken, 2 pcs fried prawn, chicken vegetable.', 380, '/images/menu/set-takeaway-1.webp', '{}', 25),
  (get_category_id('set-menu-takeaway'), 'Set Menu Takeaway Package 02', 'Fried rice, 2 pcs fried chicken, 2 pcs fried prawn, 2 pcs special chicken curry, vegetables. (Min 2 box)', 450, '/images/menu/set-takeaway-2.webp', '{}', 30),
  (get_category_id('set-menu-takeaway'), 'Set Menu Takeaway Package 03', 'Fried rice, 2 pcs fried chicken, chicken vegetable, beef sizzling.', 490, '/images/menu/set-takeaway-3.webp', '{}', 30);

-- =====================================================
-- BIRYANI ITEMS
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, spice_level, prep_time) VALUES
  (get_category_id('biryani'), 'Star Special Kacchi Biryani (Chinigura)', 'Served with Jali Kabab.', 330, '/images/menu/kacchi-chinigura.webp', TRUE, 2, 60),
  (get_category_id('biryani'), 'Star Special Kacchi Biryani (Basmati)', 'Served with Jali Kabab.', 350, '/images/menu/kacchi-basmati.webp', TRUE, 2, 60),
  (get_category_id('biryani'), 'Special Morog Polao', 'Served with Jali Kabab.', 250, '/images/menu/morog-polao.webp', FALSE, 1, 45),
  (get_category_id('biryani'), 'Beef Tehari', 'Traditional beef tehari.', 180, '/images/menu/beef-tehari.webp', FALSE, 2, 40),
  (get_category_id('biryani'), 'Mutton Tehari', 'Minimum order for 20 persons.', 250, '/images/menu/mutton-tehari.webp', FALSE, 2, 45),
  (get_category_id('biryani'), 'Chicken Dum Biryani', 'Served with Jali Kabab. Minimum order for 20 persons.', 250, '/images/menu/chicken-dum-biryani.webp', FALSE, 2, 50),
  (get_category_id('biryani'), 'Hyderabadi Biryani', 'Served with Jali Kabab. Minimum order for 20 persons.', 450, '/images/menu/hyderabadi-biryani.webp', FALSE, 3, 60);

-- =====================================================
-- BANGLA MENU
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, dietary_tags, spice_level, prep_time) VALUES
  (get_category_id('bangla-menu'), 'White Rice (Per Person)', 'Steamed plain rice.', 50, '/images/menu/bangla-rice.webp', ARRAY['vegan', 'gluten-free'], 0, 15),
  (get_category_id('bangla-menu'), 'Bhuna Khichuri with Chicken', 'Spiced lentil rice with chicken.', 220, '/images/menu/bhuna-khichuri-chicken.webp', '{}', 1, 35),
  (get_category_id('bangla-menu'), 'Bhuna Khichuri with Beef', 'Spiced lentil rice with beef.', 250, '/images/menu/bhuna-khichuri-beef.webp', '{}', 1, 35),
  (get_category_id('bangla-menu'), 'Morog Polao (Bangla Menu)', 'Classic chicken pilaf with egg.', 300, '/images/menu/bangla-morog-polao.webp', '{}', 1, 40),
  (get_category_id('bangla-menu'), 'Mixed Vegetables', 'Traditional Bengali style mixed vegetables.', 50, '/images/menu/bangla-veg.webp', ARRAY['vegetarian', 'vegan'], 0, 20),
  (get_category_id('bangla-menu'), 'Home-style Dal', 'Lentil curry, Bengali style.', 50, '/images/menu/bangla-dal.webp', ARRAY['vegetarian', 'vegan', 'gluten-free'], 0, 25),
  (get_category_id('bangla-menu'), 'Sweet Curd', 'Traditional sweet yogurt.', 80, '/images/menu/mishti-doi.webp', ARRAY['vegetarian'], 0, 5),
  (get_category_id('bangla-menu'), 'Duck Curry (Hasher Mangsho Bhuna)', 'Rich spiced duck curry.', 1000, '/images/menu/duck-curry.webp', '{}', 2, 50);

-- =====================================================
-- BEEF (GORU)
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('beef'), 'Beef Masala', 'Rich masala curry with tender beef.', 280, '/images/menu/beef-masala.webp', 2, 45),
  (get_category_id('beef'), 'Beef Chili Onion', 'Spicy beef with bell peppers and onions.', 300, '/images/menu/beef-chili-onion.webp', 3, 30),
  (get_category_id('beef'), 'Beef Chili Dry', 'Dry preparation with aromatic spices.', 320, '/images/menu/beef-chili-dry.webp', 3, 35),
  (get_category_id('beef'), 'Beef Acharya', 'Tangy pickle-spiced beef curry.', 290, '/images/menu/beef-acharya.webp', 2, 40),
  (get_category_id('beef'), 'Beef Korai', 'Wok-fried beef with tomatoes and peppers.', 310, '/images/menu/beef-korai.webp', 2, 35),
  (get_category_id('beef'), 'Beef Peshawar (1:2)', 'Peshawar style beef curry - half portion.', 350, '/images/menu/beef-peshawar-half.webp', 2, 50),
  (get_category_id('beef'), 'Beef Peshawar (1:1)', 'Peshawar style beef curry - full portion.', 650, '/images/menu/beef-peshawar-full.webp', 2, 50),
  (get_category_id('beef'), 'Beef Bhuna', 'Slow-cooked beef in thick gravy.', 290, '/images/menu/beef-bhuna.webp', 2, 50),
  (get_category_id('beef'), 'Beef Rezala', 'Creamy white curry with aromatic spices.', 320, '/images/menu/beef-rezala.webp', 1, 45),
  (get_category_id('beef'), 'Beef Kala Bhuna', 'Dark roasted beef specialty.', 340, '/images/menu/beef-kala-bhuna.webp', 2, 55);

-- =====================================================
-- MUTTON (KHASI)
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('mutton'), 'Mutton Masala', 'Rich masala curry with tender mutton.', 350, '/images/menu/mutton-masala.webp', 2, 50),
  (get_category_id('mutton'), 'Mutton Chili Onion', 'Spicy mutton with bell peppers and onions.', 370, '/images/menu/mutton-chili-onion.webp', 3, 35),
  (get_category_id('mutton'), 'Mutton Chili Dry', 'Dry preparation with aromatic spices.', 390, '/images/menu/mutton-chili-dry.webp', 3, 40),
  (get_category_id('mutton'), 'Mutton Acharya', 'Tangy pickle-spiced mutton curry.', 360, '/images/menu/mutton-acharya.webp', 2, 45),
  (get_category_id('mutton'), 'Mutton Korai', 'Wok-fried mutton with tomatoes and peppers.', 380, '/images/menu/mutton-korai.webp', 2, 40),
  (get_category_id('mutton'), 'Mutton Bhuna', 'Slow-cooked mutton in thick gravy.', 360, '/images/menu/mutton-bhuna.webp', 2, 55),
  (get_category_id('mutton'), 'Mutton Rezala', 'Creamy white curry with aromatic spices.', 390, '/images/menu/mutton-rezala.webp', 1, 50),
  (get_category_id('mutton'), 'Mutton Kala Bhuna', 'Dark roasted mutton specialty.', 410, '/images/menu/mutton-kala-bhuna.webp', 2, 60),
  (get_category_id('mutton'), 'Mutton Do Piaza', 'Mutton cooked with double onions.', 380, '/images/menu/mutton-do-piaza.webp', 2, 45);

-- =====================================================
-- CHICKEN / SONALI CHICKEN
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('chicken'), 'Chicken Masala', 'Rich masala curry with tender chicken.', 200, '/images/menu/chicken-masala.webp', 2, 35),
  (get_category_id('chicken'), 'Chicken Chili Onion', 'Spicy chicken with bell peppers and onions.', 220, '/images/menu/chicken-chili-onion.webp', 3, 25),
  (get_category_id('chicken'), 'Chicken Chili Dry', 'Dry preparation with aromatic spices.', 240, '/images/menu/chicken-chili-dry.webp', 3, 30),
  (get_category_id('chicken'), 'Chicken Acharya', 'Tangy pickle-spiced chicken curry.', 210, '/images/menu/chicken-acharya.webp', 2, 35),
  (get_category_id('chicken'), 'Chicken Korai', 'Wok-fried chicken with tomatoes and peppers.', 230, '/images/menu/chicken-korai.webp', 2, 30),
  (get_category_id('chicken'), 'Chicken Bhuna', 'Slow-cooked chicken in thick gravy.', 210, '/images/menu/chicken-bhuna.webp', 2, 40),
  (get_category_id('chicken'), 'Chicken Rezala', 'Creamy white curry with aromatic spices.', 240, '/images/menu/chicken-rezala.webp', 1, 35),
  (get_category_id('chicken'), 'Chicken Tikka Masala', 'Grilled chicken in creamy tomato sauce.', 260, '/images/menu/chicken-tikka-masala.webp', 2, 40),
  (get_category_id('chicken'), 'Butter Chicken', 'Creamy tomato-butter sauce with tender chicken.', 270, '/images/menu/butter-chicken.webp', 1, 35),
  (get_category_id('chicken'), 'Chicken Curry (Home Style)', 'Traditional Bengali chicken curry.', 190, '/images/menu/chicken-curry.webp', 1, 35),
  (get_category_id('chicken'), 'Fried Chicken (2 pcs)', 'Crispy golden fried chicken.', 150, '/images/menu/fried-chicken-2.webp', 1, 20),
  (get_category_id('chicken'), 'Fried Chicken (4 pcs)', 'Crispy golden fried chicken.', 280, '/images/menu/fried-chicken-4.webp', 1, 25),
  (get_category_id('chicken'), 'Fried Chicken (6 pcs)', 'Crispy golden fried chicken.', 400, '/images/menu/fried-chicken-6.webp', 1, 30),
  (get_category_id('chicken'), 'Chicken 65', 'Spicy South Indian fried chicken.', 250, '/images/menu/chicken-65.webp', 3, 25),
  (get_category_id('chicken'), 'Chicken Manchurian', 'Indo-Chinese style chicken.', 240, '/images/menu/chicken-manchurian.webp', 2, 30);

-- =====================================================
-- PRAWN & FISH
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time, dietary_tags) VALUES
  (get_category_id('prawn-fish'), 'Lobster King Prawn', 'Grilled lobster-sized prawns with butter.', 1200, '/images/menu/lobster-prawn.webp', 1, 25, '{}'),
  (get_category_id('prawn-fish'), 'Prawn Masala', 'Rich masala curry with jumbo prawns.', 450, '/images/menu/prawn-masala.webp', 2, 30, '{}'),
  (get_category_id('prawn-fish'), 'Prawn Chili Onion', 'Spicy prawns with bell peppers and onions.', 470, '/images/menu/prawn-chili-onion.webp', 3, 25, '{}'),
  (get_category_id('prawn-fish'), 'Garlic Prawn', 'Prawns sautéed in garlic butter.', 480, '/images/menu/garlic-prawn.webp', 1, 20, '{}'),
  (get_category_id('prawn-fish'), 'Sweet & Sour Prawn', 'Tangy sweet and sour glazed prawns.', 460, '/images/menu/sweet-sour-prawn.webp', 1, 25, '{}'),
  (get_category_id('prawn-fish'), 'Hot & Sour Prawn', 'Spicy and tangy prawns.', 470, '/images/menu/hot-sour-prawn.webp', 3, 25, '{}'),
  (get_category_id('prawn-fish'), 'Fried Prawn (6 pcs)', 'Crispy battered fried prawns.', 350, '/images/menu/fried-prawn.webp', 1, 15, '{}'),
  (get_category_id('prawn-fish'), 'Fish Ginger Mushroom', 'Fish fillet with ginger and mushroom sauce.', 320, '/images/menu/fish-ginger-mushroom.webp', 1, 25, '{}'),
  (get_category_id('prawn-fish'), 'Fish Manchurian', 'Indo-Chinese style fish.', 310, '/images/menu/fish-manchurian.webp', 2, 25, '{}'),
  (get_category_id('prawn-fish'), 'Fish 65', 'Spicy South Indian fried fish.', 300, '/images/menu/fish-65.webp', 3, 20, '{}'),
  (get_category_id('prawn-fish'), 'Grilled Pomfret', 'Whole pomfret grilled with herbs.', 650, '/images/menu/grilled-pomfret.webp', 1, 30, '{}'),
  (get_category_id('prawn-fish'), 'BBQ Vetki (Barramundi)', 'Grilled barramundi with BBQ glaze.', 800, '/images/menu/bbq-vetki.webp', 1, 35, '{}'),
  (get_category_id('prawn-fish'), 'Hilsa Fry', 'Bengali style fried hilsa fish.', 550, '/images/menu/hilsa-fry.webp', 2, 20, '{}');

-- =====================================================
-- KABAB
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('kabab'), 'Jali Kabab (2 pcs)', 'Traditional mesh-style beef kabab.', 120, '/images/menu/jali-kabab-2.webp', 2, 25),
  (get_category_id('kabab'), 'Jali Kabab (4 pcs)', 'Traditional mesh-style beef kabab.', 220, '/images/menu/jali-kabab-4.webp', 2, 30),
  (get_category_id('kabab'), 'Seekh Kabab (2 pcs)', 'Spiced minced meat skewers.', 130, '/images/menu/seekh-kabab-2.webp', 2, 25),
  (get_category_id('kabab'), 'Seekh Kabab (4 pcs)', 'Spiced minced meat skewers.', 240, '/images/menu/seekh-kabab-4.webp', 2, 30),
  (get_category_id('kabab'), 'Chicken Tikka (4 pcs)', 'Marinated grilled chicken chunks.', 200, '/images/menu/chicken-tikka.webp', 2, 30),
  (get_category_id('kabab'), 'Chicken Tikka (8 pcs)', 'Marinated grilled chicken chunks.', 380, '/images/menu/chicken-tikka-8.webp', 2, 35),
  (get_category_id('kabab'), 'Reshmi Kabab (2 pcs)', 'Creamy minced chicken kabab.', 140, '/images/menu/reshmi-kabab-2.webp', 1, 25),
  (get_category_id('kabab'), 'Reshmi Kabab (4 pcs)', 'Creamy minced chicken kabab.', 260, '/images/menu/reshmi-kabab-4.webp', 1, 30),
  (get_category_id('kabab'), 'Chicken Grill (Half)', 'Grilled half chicken with herbs.', 350, '/images/menu/chicken-grill-half.webp', 2, 40),
  (get_category_id('kabab'), 'Chicken Grill (Full)', 'Grilled whole chicken with herbs.', 650, '/images/menu/chicken-grill-full.webp', 2, 50),
  (get_category_id('kabab'), 'Beef Boti Kabab (4 pcs)', 'Marinated beef chunks grilled.', 280, '/images/menu/beef-boti.webp', 2, 35);

-- =====================================================
-- NAAN (NUN BON)
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time, dietary_tags) VALUES
  (get_category_id('naan'), 'Plain Naan', 'Soft tandoor-baked flatbread.', 40, '/images/menu/plain-naan.webp', 0, 10, ARRAY['vegetarian']),
  (get_category_id('naan'), 'Butter Naan', 'Naan brushed with butter.', 50, '/images/menu/butter-naan.webp', 0, 10, ARRAY['vegetarian']),
  (get_category_id('naan'), 'Garlic Naan', 'Naan topped with fresh garlic.', 60, '/images/menu/garlic-naan.webp', 0, 12, ARRAY['vegetarian']),
  (get_category_id('naan'), 'Cheese Naan', 'Naan stuffed with cheese.', 80, '/images/menu/cheese-naan.webp', 0, 15, ARRAY['vegetarian']),
  (get_category_id('naan'), 'Keema Naan', 'Naan stuffed with spiced minced meat.', 100, '/images/menu/keema-naan.webp', 2, 18, '{}'),
  (get_category_id('naan'), 'Tandoori Roti', 'Whole wheat tandoor bread.', 35, '/images/menu/tandoori-roti.webp', 0, 10, ARRAY['vegetarian', 'vegan']),
  (get_category_id('naan'), 'Paratha', 'Layered flatbread.', 45, '/images/menu/paratha.webp', 0, 12, ARRAY['vegetarian']);

-- =====================================================
-- RICE
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time, dietary_tags) VALUES
  (get_category_id('rice'), 'Plain Fried Rice', 'Stir-fried rice with vegetables.', 150, '/images/menu/plain-fried-rice.webp', 0, 15, ARRAY['vegetarian']),
  (get_category_id('rice'), 'Chicken Fried Rice', 'Fried rice with chicken.', 180, '/images/menu/chicken-fried-rice.webp', 1, 20, '{}'),
  (get_category_id('rice'), 'Beef Fried Rice', 'Fried rice with beef.', 200, '/images/menu/beef-fried-rice.webp', 1, 20, '{}'),
  (get_category_id('rice'), 'Prawn Fried Rice', 'Fried rice with prawns.', 220, '/images/menu/prawn-fried-rice.webp', 1, 20, '{}'),
  (get_category_id('rice'), 'Mixed Fried Rice', 'Fried rice with chicken, beef, and prawn.', 240, '/images/menu/mixed-fried-rice.webp', 1, 25, '{}'),
  (get_category_id('rice'), 'Egg Fried Rice', 'Fried rice with scrambled eggs.', 160, '/images/menu/egg-fried-rice.webp', 0, 15, ARRAY['vegetarian']),
  (get_category_id('rice'), 'Thai Fried Rice', 'Thai-style fried rice with basil.', 190, '/images/menu/thai-fried-rice.webp', 2, 20, '{}'),
  (get_category_id('rice'), 'Steamed Rice', 'Plain steamed basmati rice.', 80, '/images/menu/steamed-rice.webp', 0, 15, ARRAY['vegan', 'gluten-free']),
  (get_category_id('rice'), 'Jeera Rice', 'Basmati rice with cumin.', 100, '/images/menu/jeera-rice.webp', 0, 15, ARRAY['vegetarian', 'gluten-free']);

-- =====================================================
-- PIZZA
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('pizza'), 'Margherita Pizza (Small)', 'Classic tomato and mozzarella.', 250, '/images/menu/margherita-small.webp', 0, 20),
  (get_category_id('pizza'), 'Margherita Pizza (Medium)', 'Classic tomato and mozzarella.', 400, '/images/menu/margherita-medium.webp', 0, 25),
  (get_category_id('pizza'), 'Margherita Pizza (Large)', 'Classic tomato and mozzarella.', 550, '/images/menu/margherita-large.webp', 0, 30),
  (get_category_id('pizza'), 'Pepperoni Pizza (Small)', 'Tomato sauce, mozzarella, pepperoni.', 300, '/images/menu/pepperoni-small.webp', 1, 20),
  (get_category_id('pizza'), 'Pepperoni Pizza (Medium)', 'Tomato sauce, mozzarella, pepperoni.', 480, '/images/menu/pepperoni-medium.webp', 1, 25),
  (get_category_id('pizza'), 'Pepperoni Pizza (Large)', 'Tomato sauce, mozzarella, pepperoni.', 650, '/images/menu/pepperoni-large.webp', 1, 30),
  (get_category_id('pizza'), 'BBQ Chicken Pizza (Small)', 'BBQ sauce, chicken, onions, cheese.', 320, '/images/menu/bbq-chicken-small.webp', 1, 20),
  (get_category_id('pizza'), 'BBQ Chicken Pizza (Medium)', 'BBQ sauce, chicken, onions, cheese.', 520, '/images/menu/bbq-chicken-medium.webp', 1, 25),
  (get_category_id('pizza'), 'BBQ Chicken Pizza (Large)', 'BBQ sauce, chicken, onions, cheese.', 700, '/images/menu/bbq-chicken-large.webp', 1, 30),
  (get_category_id('pizza'), 'Vegetable Pizza (Small)', 'Mixed vegetables with cheese.', 270, '/images/menu/veg-pizza-small.webp', 0, 20),
  (get_category_id('pizza'), 'Vegetable Pizza (Medium)', 'Mixed vegetables with cheese.', 440, '/images/menu/veg-pizza-medium.webp', 0, 25),
  (get_category_id('pizza'), 'Vegetable Pizza (Large)', 'Mixed vegetables with cheese.', 600, '/images/menu/veg-pizza-large.webp', 0, 30);

-- =====================================================
-- BURGER
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('burger'), 'Classic Beef Burger', 'Beef patty, lettuce, tomato, onion, cheese.', 250, '/images/menu/beef-burger.webp', 1, 15),
  (get_category_id('burger'), 'Chicken Burger', 'Crispy chicken, lettuce, mayo, cheese.', 220, '/images/menu/chicken-burger.webp', 1, 15),
  (get_category_id('burger'), 'Cheese Burger', 'Beef patty with double cheese.', 270, '/images/menu/cheese-burger.webp', 1, 15),
  (get_category_id('burger'), 'Mushroom Swiss Burger', 'Beef patty, sautéed mushrooms, Swiss cheese.', 300, '/images/menu/mushroom-burger.webp', 1, 18),
  (get_category_id('burger'), 'BBQ Bacon Burger', 'Beef patty, bacon, BBQ sauce, cheese.', 320, '/images/menu/bbq-bacon-burger.webp', 1, 18),
  (get_category_id('burger'), 'Veggie Burger', 'Vegetable patty, lettuce, tomato, cheese.', 200, '/images/menu/veggie-burger.webp', 0, 15),
  (get_category_id('burger'), 'Fish Burger', 'Fried fish fillet, tartar sauce, lettuce.', 240, '/images/menu/fish-burger.webp', 1, 15);

-- =====================================================
-- SOUP
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('soup'), 'Thai Soup', 'Spicy coconut-based Thai soup.', 150, '/images/menu/thai-soup.webp', 2, 15),
  (get_category_id('soup'), 'Hot & Sour Soup', 'Tangy and spicy Chinese soup.', 130, '/images/menu/hot-sour-soup.webp', 2, 15),
  (get_category_id('soup'), 'Sweet Corn Soup', 'Creamy sweet corn soup.', 120, '/images/menu/sweet-corn-soup.webp', 0, 12),
  (get_category_id('soup'), 'Chicken Clear Soup', 'Light chicken broth with vegetables.', 110, '/images/menu/chicken-clear-soup.webp', 0, 15),
  (get_category_id('soup'), 'Vegetable Soup', 'Mixed vegetable soup.', 100, '/images/menu/veg-soup.webp', 0, 12),
  (get_category_id('soup'), 'Tomato Soup', 'Creamy tomato soup.', 110, '/images/menu/tomato-soup.webp', 0, 12),
  (get_category_id('soup'), 'Mushroom Soup', 'Creamy mushroom soup.', 140, '/images/menu/mushroom-soup.webp', 0, 15);

-- =====================================================
-- CHOWMEIN / PASTA / RAMEN
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('chowmein-pasta'), 'Chicken Chowmein', 'Stir-fried noodles with chicken.', 180, '/images/menu/chicken-chowmein.webp', 1, 20),
  (get_category_id('chowmein-pasta'), 'Beef Chowmein', 'Stir-fried noodles with beef.', 200, '/images/menu/beef-chowmein.webp', 1, 20),
  (get_category_id('chowmein-pasta'), 'Prawn Chowmein', 'Stir-fried noodles with prawns.', 220, '/images/menu/prawn-chowmein.webp', 1, 20),
  (get_category_id('chowmein-pasta'), 'Vegetable Chowmein', 'Stir-fried noodles with vegetables.', 150, '/images/menu/veg-chowmein.webp', 1, 18),
  (get_category_id('chowmein-pasta'), 'Chicken Ramen', 'Japanese noodle soup with chicken.', 220, '/images/menu/chicken-ramen.webp', 2, 25),
  (get_category_id('chowmein-pasta'), 'Beef Ramen', 'Japanese noodle soup with beef.', 240, '/images/menu/beef-ramen.webp', 2, 25),
  (get_category_id('chowmein-pasta'), 'Chicken Chop Suey', 'Stir-fried vegetables with chicken in gravy.', 190, '/images/menu/chicken-chop-suey.webp', 1, 20),
  (get_category_id('chowmein-pasta'), 'Chicken Pasta Alfredo', 'Creamy Alfredo pasta with chicken.', 250, '/images/menu/chicken-alfredo.webp', 0, 20),
  (get_category_id('chowmein-pasta'), 'Beef Pasta Bolognese', 'Pasta with rich meat sauce.', 260, '/images/menu/beef-bolognese.webp', 1, 25),
  (get_category_id('chowmein-pasta'), 'Vegetable Pasta', 'Pasta with mixed vegetables.', 180, '/images/menu/veg-pasta.webp', 0, 18);

-- =====================================================
-- APPETIZERS & SNACKS
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('appetizers-snacks'), 'Fried Wonton (10 pcs)', 'Crispy wonton with filling.', 120, '/images/menu/fried-wonton.webp', 1, 15),
  (get_category_id('appetizers-snacks'), 'Spring Roll (6 pcs)', 'Crispy vegetable spring rolls.', 140, '/images/menu/spring-roll.webp', 0, 15),
  (get_category_id('appetizers-snacks'), 'Fish Finger (6 pcs)', 'Breaded fish fingers.', 180, '/images/menu/fish-finger.webp', 0, 15),
  (get_category_id('appetizers-snacks'), 'Chicken Nuggets (8 pcs)', 'Golden fried chicken nuggets.', 160, '/images/menu/chicken-nuggets.webp', 0, 12),
  (get_category_id('appetizers-snacks'), 'Vegetable Pakora', 'Mixed vegetable fritters.', 100, '/images/menu/veg-pakora.webp', 1, 15),
  (get_category_id('appetizers-snacks'), 'Onion Rings (8 pcs)', 'Crispy battered onion rings.', 120, '/images/menu/onion-rings.webp', 0, 12),
  (get_category_id('appetizers-snacks'), 'French Fries', 'Crispy golden fries.', 100, '/images/menu/french-fries.webp', 0, 10),
  (get_category_id('appetizers-snacks'), 'Chicken Shashlik', 'Grilled chicken skewers with vegetables.', 220, '/images/menu/chicken-shashlik.webp', 2, 25),
  (get_category_id('appetizers-snacks'), 'Beef Shashlik', 'Grilled beef skewers with vegetables.', 240, '/images/menu/beef-shashlik.webp', 2, 25),
  (get_category_id('appetizers-snacks'), 'Meat Ball (6 pcs)', 'Spiced meatballs in sauce.', 180, '/images/menu/meat-ball.webp', 1, 20);

-- =====================================================
-- NACHOS
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_category_id('nachos'), 'Chicken Nachos', 'Tortilla chips with chicken, cheese, salsa.', 280, '/images/menu/chicken-nachos.webp', 2, 15),
  (get_category_id('nachos'), 'Beef Nachos', 'Tortilla chips with beef, cheese, salsa.', 300, '/images/menu/beef-nachos.webp', 2, 15),
  (get_category_id('nachos'), 'Vegetable Nachos', 'Tortilla chips with vegetables, cheese, salsa.', 250, '/images/menu/veg-nachos.webp', 1, 12),
  (get_category_id('nachos'), 'Loaded Nachos', 'Tortilla chips with chicken, beef, cheese, jalapeños.', 350, '/images/menu/loaded-nachos.webp', 3, 18);

-- =====================================================
-- SIZZLING
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, spice_level, prep_time) VALUES
  (get_category_id('sizzling'), 'Chicken Sizzling', 'Sizzling chicken with vegetables on hot plate.', 350, '/images/menu/chicken-sizzling.webp', FALSE, 2, 25),
  (get_category_id('sizzling'), 'Beef Sizzling', 'Sizzling beef with vegetables on hot plate.', 400, '/images/menu/beef-sizzling.webp', TRUE, 2, 25),
  (get_category_id('sizzling'), 'Prawn Sizzling', 'Sizzling prawns with vegetables on hot plate.', 500, '/images/menu/prawn-sizzling.webp', FALSE, 2, 20),
  (get_category_id('sizzling'), 'Mixed Sizzling', 'Chicken, beef, and prawn sizzling platter.', 550, '/images/menu/mixed-sizzling.webp', TRUE, 2, 30),
  (get_category_id('sizzling'), 'Fish Sizzling', 'Sizzling fish fillet with vegetables.', 380, '/images/menu/fish-sizzling.webp', FALSE, 2, 25);

-- =====================================================
-- VEGETABLE
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time, dietary_tags) VALUES
  (get_category_id('vegetable'), 'Mixed Vegetable Curry', 'Assorted vegetables in curry sauce.', 120, '/images/menu/mixed-veg-curry.webp', 1, 20, ARRAY['vegetarian', 'vegan']),
  (get_category_id('vegetable'), 'Vegetable Jalfrezi', 'Stir-fried vegetables in tomato sauce.', 130, '/images/menu/veg-jalfrezi.webp', 2, 20, ARRAY['vegetarian', 'vegan']),
  (get_category_id('vegetable'), 'Paneer Tikka Masala', 'Cottage cheese in creamy tomato sauce.', 180, '/images/menu/paneer-tikka-masala.webp', 2, 25, ARRAY['vegetarian']),
  (get_category_id('vegetable'), 'Palak Paneer', 'Cottage cheese in spinach gravy.', 170, '/images/menu/palak-paneer.webp', 1, 25, ARRAY['vegetarian']),
  (get_category_id('vegetable'), 'Dal Tadka', 'Tempered yellow lentils.', 90, '/images/menu/dal-tadka.webp', 1, 20, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_category_id('vegetable'), 'Chana Masala', 'Chickpeas in spiced tomato gravy.', 100, '/images/menu/chana-masala.webp', 2, 25, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_category_id('vegetable'), 'Aloo Gobi', 'Potato and cauliflower curry.', 100, '/images/menu/aloo-gobi.webp', 1, 20, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_category_id('vegetable'), 'Bhindi Masala', 'Okra in spiced gravy.', 110, '/images/menu/bhindi-masala.webp', 1, 20, ARRAY['vegetarian', 'vegan', 'gluten-free']);

-- =====================================================
-- SALAD
-- =====================================================

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time, dietary_tags) VALUES
  (get_category_id('salad'), 'Green Salad', 'Fresh mixed greens with vinaigrette.', 80, '/images/menu/green-salad.webp', 0, 5, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_category_id('salad'), 'Caesar Salad', 'Romaine lettuce, croutons, parmesan, Caesar dressing.', 150, '/images/menu/caesar-salad.webp', 0, 10, ARRAY['vegetarian']),
  (get_category_id('salad'), 'Chicken Caesar Salad', 'Caesar salad with grilled chicken.', 200, '/images/menu/chicken-caesar-salad.webp', 0, 15, '{}'),
  (get_category_id('salad'), 'Greek Salad', 'Tomato, cucumber, olives, feta, olive oil.', 160, '/images/menu/greek-salad.webp', 0, 10, ARRAY['vegetarian', 'gluten-free']),
  (get_category_id('salad'), 'Garden Salad', 'Mixed vegetables with lemon dressing.', 90, '/images/menu/garden-salad.webp', 0, 5, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_category_id('salad'), 'Russian Salad', 'Potato, carrot, peas with mayo.', 120, '/images/menu/russian-salad.webp', 0, 15, ARRAY['vegetarian']);

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public can read available categories
CREATE POLICY "Public can read menu categories"
  ON menu_categories
  FOR SELECT
  USING (true);

-- Public can read available menu items
CREATE POLICY "Public can read available menu items"
  ON menu_items
  FOR SELECT
  USING (is_available = true);

-- Admin can do everything (assumes admin role check)
CREATE POLICY "Admins have full access to categories"
  ON menu_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins have full access to menu items"
  ON menu_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- 7. CLEANUP HELPER FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS get_category_id(TEXT);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Star Café Menu System migration complete!';
  RAISE NOTICE '📊 Created menu_categories and menu_items tables';
  RAISE NOTICE '🗑️  Soft deleted existing dishes';
  RAISE NOTICE '🍽️  Seeded 20 categories and 100+ menu items';
  RAISE NOTICE '🔒 Set up RLS policies';
END $$;
