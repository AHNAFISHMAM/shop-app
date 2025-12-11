import { readFileSync, writeFileSync } from 'fs';

const menuItems = JSON.parse(readFileSync('./menu_items_list.json', 'utf-8'));

// Function to categorize dishes by name
function categorizeDish(name) {
  const lowerName = name.toLowerCase();

  // Pizza
  if (lowerName.includes('pizza')) return 'pizza';

  // Burger
  if (lowerName.includes('burger')) return 'burger';

  // Pasta/Spaghetti
  if (lowerName.includes('pasta') || lowerName.includes('spaghetti')) return 'pasta';

  // Biryani/Tehari/Pulao/Polao
  if (lowerName.includes('biryani') || lowerName.includes('tehari') ||
      lowerName.includes('polao') || lowerName.includes('polaw') ||
      lowerName.includes('khichuri')) return 'biryani';

  // Fried Rice
  if (lowerName.includes('fried rice')) return 'fried_rice';

  // Rice (Plain/Steam)
  if (lowerName.includes('rice') && !lowerName.includes('fried')) return 'rice';

  // Chowmein/Noodles/Ramen
  if (lowerName.includes('chowmein') || lowerName.includes('ramen') ||
      lowerName.includes('noodle')) return 'noodles';

  // Soup
  if (lowerName.includes('soup')) return 'soup';

  // Sizzling
  if (lowerName.includes('sizzling')) return 'sizzling';

  // Nachos
  if (lowerName.includes('nachos')) return 'nachos';

  // Salad
  if (lowerName.includes('salad')) return 'salad';

  // French Fry
  if (lowerName.includes('french fry')) return 'french_fries';

  // Kabab/Kebab
  if (lowerName.includes('kabab') || lowerName.includes('kebab') ||
      lowerName.includes('tandoori')) return 'kabab';

  // Spring Roll
  if (lowerName.includes('spring roll')) return 'spring_roll';

  // Momo
  if (lowerName.includes('momo')) return 'momo';

  // Wonton
  if (lowerName.includes('wonton')) return 'wonton';

  // Prawn dishes
  if (lowerName.includes('prawn') || lowerName.includes('lobster')) {
    if (lowerName.includes('fry')) return 'prawn_fry';
    if (lowerName.includes('curry') || lowerName.includes('malai')) return 'prawn_curry';
    return 'prawn';
  }

  // Fish dishes
  if (lowerName.includes('fish') || lowerName.includes('hilsa') ||
      lowerName.includes('vetki') || lowerName.includes('pomfret') ||
      lowerName.includes('rupchanda')) {
    if (lowerName.includes('fry')) return 'fish_fry';
    if (lowerName.includes('finger')) return 'fish_finger';
    if (lowerName.includes('fillet')) return 'fish_fillet';
    if (lowerName.includes('grill') || lowerName.includes('bbq')) return 'fish_grilled';
    return 'fish_curry';
  }

  // Beef dishes
  if (lowerName.includes('beef')) {
    if (lowerName.includes('shashlik')) return 'beef_shashlik';
    if (lowerName.includes('chili')) return 'beef_chili';
    if (lowerName.includes('sizzling')) return 'sizzling';
    return 'beef_curry';
  }

  // Mutton dishes
  if (lowerName.includes('mutton') || lowerName.includes('khasi')) {
    if (lowerName.includes('sizzling')) return 'sizzling';
    if (lowerName.includes('chili')) return 'mutton_chili';
    return 'mutton_curry';
  }

  // Duck
  if (lowerName.includes('duck') || lowerName.includes('hasher')) return 'duck_curry';

  // Chicken dishes
  if (lowerName.includes('chicken')) {
    if (lowerName.includes('crispy') || lowerName.includes('fry') ||
        lowerName.includes('fried')) return 'chicken_fried';
    if (lowerName.includes('grill') || lowerName.includes('bbq')) return 'chicken_grilled';
    if (lowerName.includes('strip') || lowerName.includes('nugget') ||
        lowerName.includes('finger')) return 'chicken_nuggets';
    if (lowerName.includes('sizzling')) return 'sizzling';
    if (lowerName.includes('tandoori')) return 'kabab';
    if (lowerName.includes('roast')) return 'chicken_roast';
    if (lowerName.includes('shashlik')) return 'chicken_shashlik';
    if (lowerName.includes('chili')) return 'chicken_chili';
    if (lowerName.includes('pakora')) return 'pakora';
    if (lowerName.includes('cutlet')) return 'cutlet';
    if (lowerName.includes('ball')) return 'chicken_ball';
    return 'chicken_curry';
  }

  // Vegetable dishes
  if (lowerName.includes('vegetable') || lowerName.includes('dal')) return 'vegetables';

  // Pakora
  if (lowerName.includes('pakora')) return 'pakora';

  // Cutlet
  if (lowerName.includes('cutlet')) return 'cutlet';

  // Meat Ball
  if (lowerName.includes('ball')) return 'meatball';

  // Bread (Nun/Naan)
  if (lowerName.includes('nun') || lowerName.includes('naan')) return 'naan';

  // Packages
  if (lowerName.includes('package')) return 'package';

  // Dessert/Sweet
  if (lowerName.includes('sweet') || lowerName.includes('curd')) return 'dessert';

  // Toppings/Extras
  if (lowerName.includes('topping') || lowerName.includes('extra')) return 'condiments';

  // Default
  return 'general';
}

// Categorize all items
const categorized = {};
menuItems.forEach(item => {
  const category = categorizeDish(item.name);
  if (!categorized[category]) {
    categorized[category] = [];
  }
  categorized[category].push(item);
});

// Print summary
console.log('\n===== MENU CATEGORIZATION =====\n');
Object.keys(categorized).sort().forEach(category => {
  console.log(`${category.toUpperCase()} (${categorized[category].length} items)`);
  categorized[category].forEach(item => {
    console.log(`  - ${item.name}`);
  });
  console.log('');
});

// Save to file
writeFileSync('categorized_menu.json', JSON.stringify(categorized, null, 2));
console.log('\n✓ Saved to categorized_menu.json\n');
