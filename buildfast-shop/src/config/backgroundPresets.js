/**
 * Background Presets Configuration
 *
 * Provides pre-configured background options for:
 * - Solid Colors
 * - CSS Gradients
 * - Image URLs (from Supabase Storage or external CDNs)
 *
 * Used by BackgroundManager component for quick background selection
 */

// ============================================================================
// SOLID COLOR PRESETS
// ============================================================================
export const solidColorPresets = [
  // Light Theme Restaurant Colors
  {
    id: 'soft-cream',
    name: 'Soft Cream',
    color: '#FAF8F5',
    description: 'Elegant soft cream - perfect for reservations'
  },
  {
    id: 'warm-ivory',
    name: 'Warm Ivory',
    color: '#FFF9F0',
    description: 'Inviting warm ivory - clean and welcoming'
  },
  {
    id: 'linen-beige',
    name: 'Linen Beige',
    color: '#F5F1EB',
    description: 'Sophisticated linen beige - restaurant elegance'
  },
  {
    id: 'off-white',
    name: 'Off-White',
    color: '#FEFCF9',
    description: 'Minimal off-white - modern and fresh'
  },
  {
    id: 'peach-cream',
    name: 'Peach Cream',
    color: '#FFF4E6',
    description: 'Warm peach cream - welcoming atmosphere'
  },
  {
    id: 'champagne',
    name: 'Champagne',
    color: '#F0EDE5',
    description: 'Luxurious champagne - premium feel'
  },
  {
    id: 'almond',
    name: 'Almond',
    color: '#FAF5EF',
    description: 'Neutral almond - elegant simplicity'
  },
  // Dark Theme Colors
  {
    id: 'dark-luxe',
    name: 'Dark Luxe',
    color: '#050509',
    description: 'Default dark background (Star Café signature)'
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    color: '#0F172A',
    description: 'Deep blue-tinted dark background'
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    color: '#1F2937',
    description: 'Medium dark gray for softer contrast'
  },
  {
    id: 'pure-black',
    name: 'Pure Black',
    color: '#000000',
    description: 'Maximum contrast black background'
  },
  {
    id: 'warm-beige',
    name: 'Warm Beige',
    color: '#F5F1E8',
    description: 'Soft beige with warm undertones'
  },
  {
    id: 'slate-gray',
    name: 'Slate Gray',
    color: '#334155',
    description: 'Balanced gray for neutral look'
  },
  {
    id: 'deep-navy',
    name: 'Deep Navy',
    color: '#1E293B',
    description: 'Rich navy blue background'
  }
];

// ============================================================================
// GRADIENT PRESETS
// ============================================================================
export const gradientPresets = [
  // Light Theme Restaurant Gradients
  {
    id: 'elegant-minimal',
    name: 'Elegant Minimal',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)',
    description: 'Subtle white to cream - modern elegance'
  },
  {
    id: 'cream-to-beige',
    name: 'Cream to Beige',
    gradient: 'linear-gradient(135deg, #FFF9F0 0%, #F5F1EB 100%)',
    description: 'Warm cream flow - inviting atmosphere'
  },
  {
    id: 'subtle-offwhite',
    name: 'Subtle Off-White',
    gradient: 'linear-gradient(to bottom, #FEFCF9 0%, #FAF8F5 100%)',
    description: 'Gentle off-white gradient - clean minimal'
  },
  {
    id: 'warm-peach-flow',
    name: 'Warm Peach Flow',
    gradient: 'linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%)',
    description: 'Warm peach tones - welcoming vibe'
  },
  {
    id: 'luxury-gradient',
    name: 'Luxury Gradient',
    gradient: 'linear-gradient(to bottom right, #FAF8F5 0%, #F0EDE5 50%, #E8E4DC 100%)',
    description: 'Triple neutral - premium sophistication'
  },
  {
    id: 'white-to-linen',
    name: 'White to Linen',
    gradient: 'linear-gradient(180deg, #FFFFFF 0%, #F5F1EB 100%)',
    description: 'Pure white to linen - refined elegance'
  },
  // Signature & Dark Gradients
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    gradient: 'linear-gradient(135deg, #C59D5F 0%, #F9FAFB 100%)',
    description: 'Signature accent gold to white (Star Café themed)'
  },
  {
    id: 'coffee-gradient',
    name: 'Coffee Gradient',
    gradient: 'linear-gradient(135deg, #4b3621 0%, #8b6f47 50%, #C59D5F 100%)',
    description: 'Rich coffee-inspired brown to gold'
  },
  {
    id: 'dark-fade',
    name: 'Dark Fade',
    gradient: 'linear-gradient(to bottom, #000000 0%, #050509 100%)',
    description: 'Subtle dark gradient (black to dark luxe)'
  },
  {
    id: 'twilight',
    name: 'Twilight',
    gradient: 'linear-gradient(to bottom, #0F172A 0%, #1E293B 100%)',
    description: 'Midnight blue gradient (sophisticated)'
  },
  // Vibrant Gradients
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: 'Purple-to-blue gradient (modern & elegant)'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    description: 'Blue gradient inspired by ocean depths'
  },
  {
    id: 'fire',
    name: 'Fire',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    description: 'Warm pink-to-red gradient (energetic)'
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
    description: 'Deep green-tinted gradient (natural & calm)'
  },
  {
    id: 'purple-dream',
    name: 'Purple Dream',
    gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
    description: 'Vibrant purple-to-pink gradient'
  }
];

// ============================================================================
// IMAGE PRESETS
// ============================================================================

// Restaurant Interiors Category
export const restaurantInteriorImages = [
  {
    id: 'restaurant-interior-1',
    name: 'Modern Restaurant',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
    description: 'Modern restaurant with natural light',
    category: 'Restaurant Interiors',
    source: 'Unsplash'
  },
  {
    id: 'elegant-dining',
    name: 'Elegant Dining',
    url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80',
    description: 'Elegant dining setup with warm ambiance',
    category: 'Restaurant Interiors',
    source: 'Unsplash'
  },
  {
    id: 'bright-restaurant',
    name: 'Bright Interior',
    url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1920&q=80',
    description: 'Bright restaurant interior with modern design',
    category: 'Restaurant Interiors',
    source: 'Unsplash'
  },
  {
    id: 'cafe-blur',
    name: 'Café Bokeh',
    url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1920&q=80',
    description: 'Soft blurred café background',
    category: 'Restaurant Interiors',
    source: 'Unsplash'
  }
];

// Table Settings Category
export const tableSettingsImages = [
  {
    id: 'elegant-table',
    name: 'Elegant Table',
    url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1920&q=80',
    description: 'Elegant table with soft lighting',
    category: 'Table Settings',
    source: 'Unsplash'
  },
  {
    id: 'fine-dining-setup',
    name: 'Fine Dining',
    url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80',
    description: 'Fine dining table setup',
    category: 'Table Settings',
    source: 'Unsplash'
  },
  {
    id: 'minimalist-table',
    name: 'Minimalist Setting',
    url: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=1920&q=80',
    description: 'Minimalist table setting',
    category: 'Table Settings',
    source: 'Unsplash'
  },
  {
    id: 'food-spread',
    name: 'Gourmet Spread',
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
    description: 'Beautiful food presentation',
    category: 'Table Settings',
    source: 'Unsplash'
  }
];

// Subtle Textures Category
export const subtleTextureImages = [
  {
    id: 'white-marble',
    name: 'White Marble',
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1920&q=80',
    description: 'White marble texture - elegant background',
    category: 'Subtle Textures',
    source: 'Unsplash'
  },
  {
    id: 'linen-fabric',
    name: 'Soft Linen',
    url: 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=1920&q=80',
    description: 'Soft linen texture - warm and inviting',
    category: 'Subtle Textures',
    source: 'Unsplash'
  },
  {
    id: 'cream-fabric',
    name: 'Cream Fabric',
    url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=1920&q=80',
    description: 'Cream fabric texture - sophisticated',
    category: 'Subtle Textures',
    source: 'Unsplash'
  },
  {
    id: 'wood-texture',
    name: 'Wood Grain',
    url: 'https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=1920&q=80',
    description: 'Natural wood grain pattern',
    category: 'Subtle Textures',
    source: 'Unsplash'
  }
];

// Additional Images (existing favorites)
export const additionalImages = [
  {
    id: 'coffee-beans',
    name: 'Coffee Beans',
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&q=80',
    description: 'Rich coffee beans background',
    category: 'Additional',
    source: 'Unsplash'
  },
  {
    id: 'marble-pattern',
    name: 'Black Marble',
    url: 'https://images.unsplash.com/photo-1615799262359-f7f8d9b1d618?w=1920&q=80',
    description: 'Elegant black marble texture',
    category: 'Additional',
    source: 'Unsplash'
  },
  {
    id: 'abstract-gold',
    name: 'Gold Waves',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80',
    description: 'Luxurious gold abstract pattern',
    category: 'Additional',
    source: 'Unsplash'
  },
  {
    id: 'minimalist-dark',
    name: 'Dark Minimal',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80',
    description: 'Clean dark gradient',
    category: 'Additional',
    source: 'Unsplash'
  }
];

// Combined array for backward compatibility
export const imagePresets = [
  ...restaurantInteriorImages,
  ...tableSettingsImages,
  ...subtleTextureImages,
  ...additionalImages
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all presets for a specific type
 */
export const getPresetsByType = (type) => {
  switch (type) {
    case 'solid':
      return solidColorPresets;
    case 'gradient':
      return gradientPresets;
    case 'image':
      return imagePresets;
    default:
      return [];
  }
};

/**
 * Find a specific preset by ID across all types
 */
export const findPresetById = (id) => {
  const allPresets = [
    ...solidColorPresets,
    ...gradientPresets,
    ...imagePresets
  ];
  return allPresets.find(preset => preset.id === id);
};

/**
 * Get preset preview (for displaying in selector)
 */
export const getPresetPreview = (preset) => {
  if (preset.color) {
    return { background: preset.color };
  }
  if (preset.gradient) {
    return { background: preset.gradient };
  }
  if (preset.url) {
    return { backgroundImage: `url(${preset.url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return {};
};
