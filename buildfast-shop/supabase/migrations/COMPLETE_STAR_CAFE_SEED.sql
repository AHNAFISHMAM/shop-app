-- =====================================================
-- COMPLETE STAR CAFÉ MENU - ALL 100+ DISHES
-- =====================================================
-- This script includes ALL Star Café dishes from the menu
-- Run this AFTER creating tables (MANUAL_star_cafe_menu_complete.sql)
-- =====================================================

-- Helper function
CREATE OR REPLACE FUNCTION get_cat(slug TEXT) RETURNS UUID AS $$
  SELECT id FROM menu_categories WHERE menu_categories.slug = $1 LIMIT 1;
$$ LANGUAGE SQL;

-- =====================================================
-- COMPLETE MENU ITEMS
-- =====================================================

-- SET MENU (DINE IN) - 4 items
INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, prep_time)
SELECT get_cat('set-menu-dine'), 'Set Menu Dine Package 01', 'Fried rice, 2 pcs fried chicken, mixed vegetables, 2 pcs fried prawn, soft drink, 500ml mineral water.', 450, '/images/menu/set-dine-1.webp', TRUE, 30
WHERE get_cat('set-menu-dine') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time)
SELECT get_cat('set-menu-dine'), 'Set Menu Dine Package 02', 'Fried rice, 2 pcs fried chicken, mixed vegetables, 2 pcs fried prawn, 2 pcs special chicken curry, soft drink, 500ml mineral water. (Min 2 persons)', 550, '/images/menu/set-dine-2.webp', 35
WHERE get_cat('set-menu-dine') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time)
SELECT get_cat('set-menu-dine'), 'Set Menu Dine Package 03', 'Fried rice, 2 pcs fried chicken, mixed vegetables, special beef sizzling, soft drink, 500ml mineral water. (Min 3 persons)', 590, '/images/menu/set-dine-3.webp', 40
WHERE get_cat('set-menu-dine') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time)
SELECT get_cat('set-menu-dine'), 'Set Menu Dine Package 04', 'Thai soup, fried wonton, fried rice, 2 pcs fried chicken, mixed vegetables, beef sizzling, soft drink, 500ml mineral water.', 680, '/images/menu/set-dine-4.webp', 45
WHERE get_cat('set-menu-dine') IS NOT NULL;

-- SET MENU (TAKE AWAY) - 3 items
INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time)
SELECT get_cat('set-menu-takeaway'), 'Set Menu Takeaway Package 01', 'Fried rice, 2 pcs fried chicken, 2 pcs fried prawn, chicken vegetable.', 380, '/images/menu/set-takeaway-1.webp', 25
WHERE get_cat('set-menu-takeaway') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time)
SELECT get_cat('set-menu-takeaway'), 'Set Menu Takeaway Package 02', 'Fried rice, 2 pcs fried chicken, 2 pcs fried prawn, 2 pcs special chicken curry, vegetables. (Min 2 box)', 450, '/images/menu/set-takeaway-2.webp', 30
WHERE get_cat('set-menu-takeaway') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time)
SELECT get_cat('set-menu-takeaway'), 'Set Menu Takeaway Package 03', 'Fried rice, 2 pcs fried chicken, chicken vegetable, beef sizzling.', 490, '/images/menu/set-takeaway-3.webp', 30
WHERE get_cat('set-menu-takeaway') IS NOT NULL;

-- BIRYANI - 7 items
INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, spice_level, prep_time)
SELECT get_cat('biryani'), 'Star Special Kacchi Biryani (Chinigura)', 'Served with Jali Kabab.', 330, '/images/menu/kacchi-chinigura.webp', TRUE, 2, 60
WHERE get_cat('biryani') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, spice_level, prep_time)
SELECT get_cat('biryani'), 'Star Special Kacchi Biryani (Basmati)', 'Served with Jali Kabab.', 350, '/images/menu/kacchi-basmati.webp', TRUE, 2, 60
WHERE get_cat('biryani') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('biryani'), 'Special Morog Polao', 'Served with Jali Kabab.', 250, '/images/menu/morog-polao.webp', 1, 45
WHERE get_cat('biryani') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('biryani'), 'Beef Tehari', 'Traditional beef tehari.', 180, '/images/menu/beef-tehari.webp', 2, 40
WHERE get_cat('biryani') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('biryani'), 'Mutton Tehari', 'Minimum order for 20 persons.', 250, '/images/menu/mutton-tehari.webp', 2, 45
WHERE get_cat('biryani') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('biryani'), 'Chicken Dum Biryani', 'Served with Jali Kabab. Minimum order for 20 persons.', 250, '/images/menu/chicken-dum-biryani.webp', 2, 50
WHERE get_cat('biryani') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('biryani'), 'Hyderabadi Biryani', 'Served with Jali Kabab. Minimum order for 20 persons.', 450, '/images/menu/hyderabadi-biryani.webp', 3, 60
WHERE get_cat('biryani') IS NOT NULL;

-- BANGLA MENU - 8 items
INSERT INTO menu_items (category_id, name, description, price, image_url, dietary_tags, spice_level, prep_time)
SELECT get_cat('bangla-menu'), 'White Rice (Per Person)', 'Steamed plain rice.', 50, '/images/menu/bangla-rice.webp', ARRAY['vegan', 'gluten-free'], 0, 15
WHERE get_cat('bangla-menu') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('bangla-menu'), 'Bhuna Khichuri with Chicken', 'Spiced lentil rice with chicken.', 220, '/images/menu/bhuna-khichuri-chicken.webp', 1, 35
WHERE get_cat('bangla-menu') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('bangla-menu'), 'Bhuna Khichuri with Beef', 'Spiced lentil rice with beef.', 250, '/images/menu/bhuna-khichuri-beef.webp', 1, 35
WHERE get_cat('bangla-menu') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('bangla-menu'), 'Morog Polao (Bangla Menu)', 'Classic chicken pilaf with egg.', 300, '/images/menu/bangla-morog-polao.webp', 1, 40
WHERE get_cat('bangla-menu') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, dietary_tags, prep_time)
SELECT get_cat('bangla-menu'), 'Mixed Vegetables', 'Traditional Bengali style mixed vegetables.', 50, '/images/menu/bangla-veg.webp', ARRAY['vegetarian', 'vegan'], 20
WHERE get_cat('bangla-menu') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, dietary_tags, prep_time)
SELECT get_cat('bangla-menu'), 'Home-style Dal', 'Lentil curry, Bengali style.', 50, '/images/menu/bangla-dal.webp', ARRAY['vegetarian', 'vegan', 'gluten-free'], 25
WHERE get_cat('bangla-menu') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, dietary_tags, prep_time)
SELECT get_cat('bangla-menu'), 'Sweet Curd', 'Traditional sweet yogurt.', 80, '/images/menu/mishti-doi.webp', ARRAY['vegetarian'], 5
WHERE get_cat('bangla-menu') IS NOT NULL;

INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time)
SELECT get_cat('bangla-menu'), 'Duck Curry (Hasher Mangsho Bhuna)', 'Rich spiced duck curry.', 1000, '/images/menu/duck-curry.webp', 2, 50
WHERE get_cat('bangla-menu') IS NOT NULL;

-- BEEF - 10 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('beef'), 'Beef Masala', 'Rich masala curry with tender beef.', 280, '/images/menu/beef-masala.webp', 2, 45),
  (get_cat('beef'), 'Beef Chili Onion', 'Spicy beef with bell peppers and onions.', 300, '/images/menu/beef-chili-onion.webp', 3, 30),
  (get_cat('beef'), 'Beef Chili Dry', 'Dry preparation with aromatic spices.', 320, '/images/menu/beef-chili-dry.webp', 3, 35),
  (get_cat('beef'), 'Beef Acharya', 'Tangy pickle-spiced beef curry.', 290, '/images/menu/beef-acharya.webp', 2, 40),
  (get_cat('beef'), 'Beef Korai', 'Wok-fried beef with tomatoes and peppers.', 310, '/images/menu/beef-korai.webp', 2, 35),
  (get_cat('beef'), 'Beef Peshawar (1:2)', 'Peshawar style beef curry - half portion.', 350, '/images/menu/beef-peshawar-half.webp', 2, 50),
  (get_cat('beef'), 'Beef Peshawar (1:1)', 'Peshawar style beef curry - full portion.', 650, '/images/menu/beef-peshawar-full.webp', 2, 50),
  (get_cat('beef'), 'Beef Bhuna', 'Slow-cooked beef in thick gravy.', 290, '/images/menu/beef-bhuna.webp', 2, 50),
  (get_cat('beef'), 'Beef Rezala', 'Creamy white curry with aromatic spices.', 320, '/images/menu/beef-rezala.webp', 1, 45),
  (get_cat('beef'), 'Beef Kala Bhuna', 'Dark roasted beef specialty.', 340, '/images/menu/beef-kala-bhuna.webp', 2, 55);

-- MUTTON - 9 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('mutton'), 'Mutton Masala', 'Rich masala curry with tender mutton.', 350, '/images/menu/mutton-masala.webp', 2, 50),
  (get_cat('mutton'), 'Mutton Chili Onion', 'Spicy mutton with bell peppers and onions.', 370, '/images/menu/mutton-chili-onion.webp', 3, 35),
  (get_cat('mutton'), 'Mutton Chili Dry', 'Dry preparation with aromatic spices.', 390, '/images/menu/mutton-chili-dry.webp', 3, 40),
  (get_cat('mutton'), 'Mutton Acharya', 'Tangy pickle-spiced mutton curry.', 360, '/images/menu/mutton-acharya.webp', 2, 45),
  (get_cat('mutton'), 'Mutton Korai', 'Wok-fried mutton with tomatoes and peppers.', 380, '/images/menu/mutton-korai.webp', 2, 40),
  (get_cat('mutton'), 'Mutton Bhuna', 'Slow-cooked mutton in thick gravy.', 360, '/images/menu/mutton-bhuna.webp', 2, 55),
  (get_cat('mutton'), 'Mutton Rezala', 'Creamy white curry with aromatic spices.', 390, '/images/menu/mutton-rezala.webp', 1, 50),
  (get_cat('mutton'), 'Mutton Kala Bhuna', 'Dark roasted mutton specialty.', 410, '/images/menu/mutton-kala-bhuna.webp', 2, 60),
  (get_cat('mutton'), 'Mutton Do Piaza', 'Mutton cooked with double onions.', 380, '/images/menu/mutton-do-piaza.webp', 2, 45);

-- CHICKEN - 15 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('chicken'), 'Chicken Masala', 'Rich masala curry with tender chicken.', 200, '/images/menu/chicken-masala.webp', 2, 35),
  (get_cat('chicken'), 'Chicken Chili Onion', 'Spicy chicken with bell peppers and onions.', 220, '/images/menu/chicken-chili-onion.webp', 3, 25),
  (get_cat('chicken'), 'Chicken Chili Dry', 'Dry preparation with aromatic spices.', 240, '/images/menu/chicken-chili-dry.webp', 3, 30),
  (get_cat('chicken'), 'Chicken Acharya', 'Tangy pickle-spiced chicken curry.', 210, '/images/menu/chicken-acharya.webp', 2, 35),
  (get_cat('chicken'), 'Chicken Korai', 'Wok-fried chicken with tomatoes and peppers.', 230, '/images/menu/chicken-korai.webp', 2, 30),
  (get_cat('chicken'), 'Chicken Bhuna', 'Slow-cooked chicken in thick gravy.', 210, '/images/menu/chicken-bhuna.webp', 2, 40),
  (get_cat('chicken'), 'Chicken Rezala', 'Creamy white curry with aromatic spices.', 240, '/images/menu/chicken-rezala.webp', 1, 35),
  (get_cat('chicken'), 'Chicken Tikka Masala', 'Grilled chicken in creamy tomato sauce.', 260, '/images/menu/chicken-tikka-masala.webp', 2, 40),
  (get_cat('chicken'), 'Butter Chicken', 'Creamy tomato-butter sauce with tender chicken.', 270, '/images/menu/butter-chicken.webp', 1, 35),
  (get_cat('chicken'), 'Chicken Curry (Home Style)', 'Traditional Bengali chicken curry.', 190, '/images/menu/chicken-curry.webp', 1, 35),
  (get_cat('chicken'), 'Fried Chicken (2 pcs)', 'Crispy golden fried chicken.', 150, '/images/menu/fried-chicken-2.webp', 1, 20),
  (get_cat('chicken'), 'Fried Chicken (4 pcs)', 'Crispy golden fried chicken.', 280, '/images/menu/fried-chicken-4.webp', 1, 25),
  (get_cat('chicken'), 'Fried Chicken (6 pcs)', 'Crispy golden fried chicken.', 400, '/images/menu/fried-chicken-6.webp', 1, 30),
  (get_cat('chicken'), 'Chicken 65', 'Spicy South Indian fried chicken.', 250, '/images/menu/chicken-65.webp', 3, 25),
  (get_cat('chicken'), 'Chicken Manchurian', 'Indo-Chinese style chicken.', 240, '/images/menu/chicken-manchurian.webp', 2, 30);

-- PRAWN & FISH - 13 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('prawn-fish'), 'Lobster King Prawn', 'Grilled lobster-sized prawns with butter.', 1200, '/images/menu/lobster-prawn.webp', 1, 25),
  (get_cat('prawn-fish'), 'Prawn Masala', 'Rich masala curry with jumbo prawns.', 450, '/images/menu/prawn-masala.webp', 2, 30),
  (get_cat('prawn-fish'), 'Prawn Chili Onion', 'Spicy prawns with bell peppers and onions.', 470, '/images/menu/prawn-chili-onion.webp', 3, 25),
  (get_cat('prawn-fish'), 'Garlic Prawn', 'Prawns sautéed in garlic butter.', 480, '/images/menu/garlic-prawn.webp', 1, 20),
  (get_cat('prawn-fish'), 'Sweet & Sour Prawn', 'Tangy sweet and sour glazed prawns.', 460, '/images/menu/sweet-sour-prawn.webp', 1, 25),
  (get_cat('prawn-fish'), 'Hot & Sour Prawn', 'Spicy and tangy prawns.', 470, '/images/menu/hot-sour-prawn.webp', 3, 25),
  (get_cat('prawn-fish'), 'Fried Prawn (6 pcs)', 'Crispy battered fried prawns.', 350, '/images/menu/fried-prawn.webp', 1, 15),
  (get_cat('prawn-fish'), 'Fish Ginger Mushroom', 'Fish fillet with ginger and mushroom sauce.', 320, '/images/menu/fish-ginger-mushroom.webp', 1, 25),
  (get_cat('prawn-fish'), 'Fish Manchurian', 'Indo-Chinese style fish.', 310, '/images/menu/fish-manchurian.webp', 2, 25),
  (get_cat('prawn-fish'), 'Fish 65', 'Spicy South Indian fried fish.', 300, '/images/menu/fish-65.webp', 3, 20),
  (get_cat('prawn-fish'), 'Grilled Pomfret', 'Whole pomfret grilled with herbs.', 650, '/images/menu/grilled-pomfret.webp', 1, 30),
  (get_cat('prawn-fish'), 'BBQ Vetki (Barramundi)', 'Grilled barramundi with BBQ glaze.', 800, '/images/menu/bbq-vetki.webp', 1, 35),
  (get_cat('prawn-fish'), 'Hilsa Fry', 'Bengali style fried hilsa fish.', 550, '/images/menu/hilsa-fry.webp', 2, 20);

-- KABAB - 11 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('kabab'), 'Jali Kabab (2 pcs)', 'Traditional mesh-style beef kabab.', 120, '/images/menu/jali-kabab-2.webp', 2, 25),
  (get_cat('kabab'), 'Jali Kabab (4 pcs)', 'Traditional mesh-style beef kabab.', 220, '/images/menu/jali-kabab-4.webp', 2, 30),
  (get_cat('kabab'), 'Seekh Kabab (2 pcs)', 'Spiced minced meat skewers.', 130, '/images/menu/seekh-kabab-2.webp', 2, 25),
  (get_cat('kabab'), 'Seekh Kabab (4 pcs)', 'Spiced minced meat skewers.', 240, '/images/menu/seekh-kabab-4.webp', 2, 30),
  (get_cat('kabab'), 'Chicken Tikka (4 pcs)', 'Marinated grilled chicken chunks.', 200, '/images/menu/chicken-tikka.webp', 2, 30),
  (get_cat('kabab'), 'Chicken Tikka (8 pcs)', 'Marinated grilled chicken chunks.', 380, '/images/menu/chicken-tikka-8.webp', 2, 35),
  (get_cat('kabab'), 'Reshmi Kabab (2 pcs)', 'Creamy minced chicken kabab.', 140, '/images/menu/reshmi-kabab-2.webp', 1, 25),
  (get_cat('kabab'), 'Reshmi Kabab (4 pcs)', 'Creamy minced chicken kabab.', 260, '/images/menu/reshmi-kabab-4.webp', 1, 30),
  (get_cat('kabab'), 'Chicken Grill (Half)', 'Grilled half chicken with herbs.', 350, '/images/menu/chicken-grill-half.webp', 2, 40),
  (get_cat('kabab'), 'Chicken Grill (Full)', 'Grilled whole chicken with herbs.', 650, '/images/menu/chicken-grill-full.webp', 2, 50),
  (get_cat('kabab'), 'Beef Boti Kabab (4 pcs)', 'Marinated beef chunks grilled.', 280, '/images/menu/beef-boti.webp', 2, 35);

-- NAAN - 7 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time, dietary_tags) VALUES
  (get_cat('naan'), 'Plain Naan', 'Soft tandoor-baked flatbread.', 40, '/images/menu/plain-naan.webp', 0, 10, ARRAY['vegetarian']),
  (get_cat('naan'), 'Butter Naan', 'Naan brushed with butter.', 50, '/images/menu/butter-naan.webp', 0, 10, ARRAY['vegetarian']),
  (get_cat('naan'), 'Garlic Naan', 'Naan topped with fresh garlic.', 60, '/images/menu/garlic-naan.webp', 0, 12, ARRAY['vegetarian']),
  (get_cat('naan'), 'Cheese Naan', 'Naan stuffed with cheese.', 80, '/images/menu/cheese-naan.webp', 0, 15, ARRAY['vegetarian']),
  (get_cat('naan'), 'Keema Naan', 'Naan stuffed with spiced minced meat.', 100, '/images/menu/keema-naan.webp', 2, 18, '{}'),
  (get_cat('naan'), 'Tandoori Roti', 'Whole wheat tandoor bread.', 35, '/images/menu/tandoori-roti.webp', 0, 10, ARRAY['vegetarian', 'vegan']),
  (get_cat('naan'), 'Paratha', 'Layered flatbread.', 45, '/images/menu/paratha.webp', 0, 12, ARRAY['vegetarian']);

-- RICE - 9 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time, dietary_tags) VALUES
  (get_cat('rice'), 'Plain Fried Rice', 'Stir-fried rice with vegetables.', 150, '/images/menu/plain-fried-rice.webp', 0, 15, ARRAY['vegetarian']),
  (get_cat('rice'), 'Chicken Fried Rice', 'Fried rice with chicken.', 180, '/images/menu/chicken-fried-rice.webp', 1, 20, '{}'),
  (get_cat('rice'), 'Beef Fried Rice', 'Fried rice with beef.', 200, '/images/menu/beef-fried-rice.webp', 1, 20, '{}'),
  (get_cat('rice'), 'Prawn Fried Rice', 'Fried rice with prawns.', 220, '/images/menu/prawn-fried-rice.webp', 1, 20, '{}'),
  (get_cat('rice'), 'Mixed Fried Rice', 'Fried rice with chicken, beef, and prawn.', 240, '/images/menu/mixed-fried-rice.webp', 1, 25, '{}'),
  (get_cat('rice'), 'Egg Fried Rice', 'Fried rice with scrambled eggs.', 160, '/images/menu/egg-fried-rice.webp', 0, 15, ARRAY['vegetarian']),
  (get_cat('rice'), 'Thai Fried Rice', 'Thai-style fried rice with basil.', 190, '/images/menu/thai-fried-rice.webp', 2, 20, '{}'),
  (get_cat('rice'), 'Steamed Rice', 'Plain steamed basmati rice.', 80, '/images/menu/steamed-rice.webp', 0, 15, ARRAY['vegan', 'gluten-free']),
  (get_cat('rice'), 'Jeera Rice', 'Basmati rice with cumin.', 100, '/images/menu/jeera-rice.webp', 0, 15, ARRAY['vegetarian', 'gluten-free']);

-- PIZZA - 12 items (Small/Medium/Large)
INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time) VALUES
  (get_cat('pizza'), 'Margherita Pizza (Small)', 'Classic tomato and mozzarella.', 250, '/images/menu/margherita-small.webp', 20),
  (get_cat('pizza'), 'Margherita Pizza (Medium)', 'Classic tomato and mozzarella.', 400, '/images/menu/margherita-medium.webp', 25),
  (get_cat('pizza'), 'Margherita Pizza (Large)', 'Classic tomato and mozzarella.', 550, '/images/menu/margherita-large.webp', 30),
  (get_cat('pizza'), 'Pepperoni Pizza (Small)', 'Tomato sauce, mozzarella, pepperoni.', 300, '/images/menu/pepperoni-small.webp', 20),
  (get_cat('pizza'), 'Pepperoni Pizza (Medium)', 'Tomato sauce, mozzarella, pepperoni.', 480, '/images/menu/pepperoni-medium.webp', 25),
  (get_cat('pizza'), 'Pepperoni Pizza (Large)', 'Tomato sauce, mozzarella, pepperoni.', 650, '/images/menu/pepperoni-large.webp', 30),
  (get_cat('pizza'), 'BBQ Chicken Pizza (Small)', 'BBQ sauce, chicken, onions, cheese.', 320, '/images/menu/bbq-chicken-small.webp', 20),
  (get_cat('pizza'), 'BBQ Chicken Pizza (Medium)', 'BBQ sauce, chicken, onions, cheese.', 520, '/images/menu/bbq-chicken-medium.webp', 25),
  (get_cat('pizza'), 'BBQ Chicken Pizza (Large)', 'BBQ sauce, chicken, onions, cheese.', 700, '/images/menu/bbq-chicken-large.webp', 30),
  (get_cat('pizza'), 'Vegetable Pizza (Small)', 'Mixed vegetables with cheese.', 270, '/images/menu/veg-pizza-small.webp', 20),
  (get_cat('pizza'), 'Vegetable Pizza (Medium)', 'Mixed vegetables with cheese.', 440, '/images/menu/veg-pizza-medium.webp', 25),
  (get_cat('pizza'), 'Vegetable Pizza (Large)', 'Mixed vegetables with cheese.', 600, '/images/menu/veg-pizza-large.webp', 30);

-- BURGER - 7 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('burger'), 'Classic Beef Burger', 'Beef patty, lettuce, tomato, onion, cheese.', 250, '/images/menu/beef-burger.webp', 1, 15),
  (get_cat('burger'), 'Chicken Burger', 'Crispy chicken, lettuce, mayo, cheese.', 220, '/images/menu/chicken-burger.webp', 1, 15),
  (get_cat('burger'), 'Cheese Burger', 'Beef patty with double cheese.', 270, '/images/menu/cheese-burger.webp', 1, 15),
  (get_cat('burger'), 'Mushroom Swiss Burger', 'Beef patty, sautéed mushrooms, Swiss cheese.', 300, '/images/menu/mushroom-burger.webp', 1, 18),
  (get_cat('burger'), 'BBQ Bacon Burger', 'Beef patty, bacon, BBQ sauce, cheese.', 320, '/images/menu/bbq-bacon-burger.webp', 1, 18),
  (get_cat('burger'), 'Veggie Burger', 'Vegetable patty, lettuce, tomato, cheese.', 200, '/images/menu/veggie-burger.webp', 0, 15),
  (get_cat('burger'), 'Fish Burger', 'Fried fish fillet, tartar sauce, lettuce.', 240, '/images/menu/fish-burger.webp', 1, 15);

-- SOUP - 7 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('soup'), 'Thai Soup', 'Spicy coconut-based Thai soup.', 150, '/images/menu/thai-soup.webp', 2, 15),
  (get_cat('soup'), 'Hot & Sour Soup', 'Tangy and spicy Chinese soup.', 130, '/images/menu/hot-sour-soup.webp', 2, 15),
  (get_cat('soup'), 'Sweet Corn Soup', 'Creamy sweet corn soup.', 120, '/images/menu/sweet-corn-soup.webp', 0, 12),
  (get_cat('soup'), 'Chicken Clear Soup', 'Light chicken broth with vegetables.', 110, '/images/menu/chicken-clear-soup.webp', 0, 15),
  (get_cat('soup'), 'Vegetable Soup', 'Mixed vegetable soup.', 100, '/images/menu/veg-soup.webp', 0, 12),
  (get_cat('soup'), 'Tomato Soup', 'Creamy tomato soup.', 110, '/images/menu/tomato-soup.webp', 0, 12),
  (get_cat('soup'), 'Mushroom Soup', 'Creamy mushroom soup.', 140, '/images/menu/mushroom-soup.webp', 0, 15);

-- CHOWMEIN / PASTA / RAMEN - 10 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('chowmein-pasta'), 'Chicken Chowmein', 'Stir-fried noodles with chicken.', 180, '/images/menu/chicken-chowmein.webp', 1, 20),
  (get_cat('chowmein-pasta'), 'Beef Chowmein', 'Stir-fried noodles with beef.', 200, '/images/menu/beef-chowmein.webp', 1, 20),
  (get_cat('chowmein-pasta'), 'Prawn Chowmein', 'Stir-fried noodles with prawns.', 220, '/images/menu/prawn-chowmein.webp', 1, 20),
  (get_cat('chowmein-pasta'), 'Vegetable Chowmein', 'Stir-fried noodles with vegetables.', 150, '/images/menu/veg-chowmein.webp', 1, 18),
  (get_cat('chowmein-pasta'), 'Chicken Ramen', 'Japanese noodle soup with chicken.', 220, '/images/menu/chicken-ramen.webp', 2, 25),
  (get_cat('chowmein-pasta'), 'Beef Ramen', 'Japanese noodle soup with beef.', 240, '/images/menu/beef-ramen.webp', 2, 25),
  (get_cat('chowmein-pasta'), 'Chicken Chop Suey', 'Stir-fried vegetables with chicken in gravy.', 190, '/images/menu/chicken-chop-suey.webp', 1, 20),
  (get_cat('chowmein-pasta'), 'Chicken Pasta Alfredo', 'Creamy Alfredo pasta with chicken.', 250, '/images/menu/chicken-alfredo.webp', 0, 20),
  (get_cat('chowmein-pasta'), 'Beef Pasta Bolognese', 'Pasta with rich meat sauce.', 260, '/images/menu/beef-bolognese.webp', 1, 25),
  (get_cat('chowmein-pasta'), 'Vegetable Pasta', 'Pasta with mixed vegetables.', 180, '/images/menu/veg-pasta.webp', 0, 18);

-- APPETIZERS & SNACKS - 10 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('appetizers-snacks'), 'Fried Wonton (10 pcs)', 'Crispy wonton with filling.', 120, '/images/menu/fried-wonton.webp', 1, 15),
  (get_cat('appetizers-snacks'), 'Spring Roll (6 pcs)', 'Crispy vegetable spring rolls.', 140, '/images/menu/spring-roll.webp', 0, 15),
  (get_cat('appetizers-snacks'), 'Fish Finger (6 pcs)', 'Breaded fish fingers.', 180, '/images/menu/fish-finger.webp', 0, 15),
  (get_cat('appetizers-snacks'), 'Chicken Nuggets (8 pcs)', 'Golden fried chicken nuggets.', 160, '/images/menu/chicken-nuggets.webp', 0, 12),
  (get_cat('appetizers-snacks'), 'Vegetable Pakora', 'Mixed vegetable fritters.', 100, '/images/menu/veg-pakora.webp', 1, 15),
  (get_cat('appetizers-snacks'), 'Onion Rings (8 pcs)', 'Crispy battered onion rings.', 120, '/images/menu/onion-rings.webp', 0, 12),
  (get_cat('appetizers-snacks'), 'French Fries', 'Crispy golden fries.', 100, '/images/menu/french-fries.webp', 0, 10),
  (get_cat('appetizers-snacks'), 'Chicken Shashlik', 'Grilled chicken skewers with vegetables.', 220, '/images/menu/chicken-shashlik.webp', 2, 25),
  (get_cat('appetizers-snacks'), 'Beef Shashlik', 'Grilled beef skewers with vegetables.', 240, '/images/menu/beef-shashlik.webp', 2, 25),
  (get_cat('appetizers-snacks'), 'Meat Ball (6 pcs)', 'Spiced meatballs in sauce.', 180, '/images/menu/meat-ball.webp', 1, 20);

-- NACHOS - 4 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time) VALUES
  (get_cat('nachos'), 'Chicken Nachos', 'Tortilla chips with chicken, cheese, salsa.', 280, '/images/menu/chicken-nachos.webp', 2, 15),
  (get_cat('nachos'), 'Beef Nachos', 'Tortilla chips with beef, cheese, salsa.', 300, '/images/menu/beef-nachos.webp', 2, 15),
  (get_cat('nachos'), 'Vegetable Nachos', 'Tortilla chips with vegetables, cheese, salsa.', 250, '/images/menu/veg-nachos.webp', 1, 12),
  (get_cat('nachos'), 'Loaded Nachos', 'Tortilla chips with chicken, beef, cheese, jalapeños.', 350, '/images/menu/loaded-nachos.webp', 3, 18);

-- SIZZLING - 5 items
INSERT INTO menu_items (category_id, name, description, price, image_url, is_featured, spice_level, prep_time) VALUES
  (get_cat('sizzling'), 'Chicken Sizzling', 'Sizzling chicken with vegetables on hot plate.', 350, '/images/menu/chicken-sizzling.webp', FALSE, 2, 25),
  (get_cat('sizzling'), 'Beef Sizzling', 'Sizzling beef with vegetables on hot plate.', 400, '/images/menu/beef-sizzling.webp', TRUE, 2, 25),
  (get_cat('sizzling'), 'Prawn Sizzling', 'Sizzling prawns with vegetables on hot plate.', 500, '/images/menu/prawn-sizzling.webp', FALSE, 2, 20),
  (get_cat('sizzling'), 'Mixed Sizzling', 'Chicken, beef, and prawn sizzling platter.', 550, '/images/menu/mixed-sizzling.webp', TRUE, 2, 30),
  (get_cat('sizzling'), 'Fish Sizzling', 'Sizzling fish fillet with vegetables.', 380, '/images/menu/fish-sizzling.webp', FALSE, 2, 25);

-- VEGETABLE - 8 items
INSERT INTO menu_items (category_id, name, description, price, image_url, spice_level, prep_time, dietary_tags) VALUES
  (get_cat('vegetable'), 'Mixed Vegetable Curry', 'Assorted vegetables in curry sauce.', 120, '/images/menu/mixed-veg-curry.webp', 1, 20, ARRAY['vegetarian', 'vegan']),
  (get_cat('vegetable'), 'Vegetable Jalfrezi', 'Stir-fried vegetables in tomato sauce.', 130, '/images/menu/veg-jalfrezi.webp', 2, 20, ARRAY['vegetarian', 'vegan']),
  (get_cat('vegetable'), 'Paneer Tikka Masala', 'Cottage cheese in creamy tomato sauce.', 180, '/images/menu/paneer-tikka-masala.webp', 2, 25, ARRAY['vegetarian']),
  (get_cat('vegetable'), 'Palak Paneer', 'Cottage cheese in spinach gravy.', 170, '/images/menu/palak-paneer.webp', 1, 25, ARRAY['vegetarian']),
  (get_cat('vegetable'), 'Dal Tadka', 'Tempered yellow lentils.', 90, '/images/menu/dal-tadka.webp', 1, 20, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_cat('vegetable'), 'Chana Masala', 'Chickpeas in spiced tomato gravy.', 100, '/images/menu/chana-masala.webp', 2, 25, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_cat('vegetable'), 'Aloo Gobi', 'Potato and cauliflower curry.', 100, '/images/menu/aloo-gobi.webp', 1, 20, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_cat('vegetable'), 'Bhindi Masala', 'Okra in spiced gravy.', 110, '/images/menu/bhindi-masala.webp', 1, 20, ARRAY['vegetarian', 'vegan', 'gluten-free']);

-- SALAD - 6 items
INSERT INTO menu_items (category_id, name, description, price, image_url, prep_time, dietary_tags) VALUES
  (get_cat('salad'), 'Green Salad', 'Fresh mixed greens with vinaigrette.', 80, '/images/menu/green-salad.webp', 5, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_cat('salad'), 'Caesar Salad', 'Romaine lettuce, croutons, parmesan, Caesar dressing.', 150, '/images/menu/caesar-salad.webp', 10, ARRAY['vegetarian']),
  (get_cat('salad'), 'Chicken Caesar Salad', 'Caesar salad with grilled chicken.', 200, '/images/menu/chicken-caesar-salad.webp', 15, '{}'),
  (get_cat('salad'), 'Greek Salad', 'Tomato, cucumber, olives, feta, olive oil.', 160, '/images/menu/greek-salad.webp', 10, ARRAY['vegetarian', 'gluten-free']),
  (get_cat('salad'), 'Garden Salad', 'Mixed vegetables with lemon dressing.', 90, '/images/menu/garden-salad.webp', 5, ARRAY['vegetarian', 'vegan', 'gluten-free']),
  (get_cat('salad'), 'Russian Salad', 'Potato, carrot, peas with mayo.', 120, '/images/menu/russian-salad.webp', 15, ARRAY['vegetarian']);

-- Cleanup
DROP FUNCTION IF EXISTS get_cat(TEXT);

-- Statistics
DO $$
DECLARE
  cat_count INTEGER;
  item_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM menu_categories;
  SELECT COUNT(*) INTO item_count FROM menu_items;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPLETE STAR CAFÉ MENU SEEDED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Total Categories: %', cat_count;
  RAISE NOTICE '🍽️  Total Menu Items: %', item_count;
  RAISE NOTICE '⭐ Featured Items: %', (SELECT COUNT(*) FROM menu_items WHERE is_featured = TRUE);
  RAISE NOTICE '🌶️  Spicy Items: %', (SELECT COUNT(*) FROM menu_items WHERE spice_level >= 2);
  RAISE NOTICE '🥗 Vegetarian Items: %', (SELECT COUNT(*) FROM menu_items WHERE 'vegetarian' = ANY(dietary_tags));
  RAISE NOTICE '========================================';
  RAISE NOTICE '👉 Next: Visit /admin/menu-items to upload images!';
  RAISE NOTICE '========================================';
END $$;
