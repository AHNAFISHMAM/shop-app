/**
 * Background Utility Functions
 *
 * Provides helper functions for:
 * - Converting database background settings to CSS styles
 * - Validating background data
 * - Generating background style objects
 * - Handling different background types (solid, gradient, image, none)
 */

/**
 * Generate CSS style object for a background section
 *
 * @param {Object} settings - Background settings from database
 * @param {string} section - Section name ('hero', 'gallery_section', 'page', 'hero_quote', 'reservation_dark', 'reservation_light')
 * @returns {Object} CSS style object
 *
 * @example
 * const heroStyle = getBackgroundStyle(storeSettings, 'hero');
 * // Returns: { background: '#050509', backgroundSize: 'cover', ... }
 */
export const getBackgroundStyle = (settings, section) => {
  if (!settings) return {};

  const typeKey = `${section}_bg_type`;
  const colorKey = `${section}_bg_color`;
  const gradientKey = `${section}_bg_gradient`;
  const imageKey = `${section}_bg_image_url`;

  const type = settings[typeKey];
  const color = settings[colorKey];
  const gradient = settings[gradientKey];
  const imageUrl = settings[imageKey];

  // Handle 'none' type - transparent background
  if (type === 'none') {
    return {
      background: 'transparent'
    };
  }

  // Handle solid color - use CSS variable if color matches theme default
  if (type === 'solid' && color) {
    // If color matches dark theme default, use CSS variable instead
    if (color === '#050509' || color.toLowerCase() === '#050509') {
      return {
        background: 'var(--bg-main)'
      };
    }
    return {
      background: color
    };
  }

  // Handle gradient
  if (type === 'gradient' && gradient) {
    return {
      background: gradient
    };
  }

  // Handle image
  if (type === 'image' && imageUrl) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }

  // Fallback to theme variable instead of hardcoded color
  return {
    background: 'var(--bg-main)'
  };
};

/**
 * Get inline style string for background (for use in style attribute)
 *
 * @param {Object} settings - Background settings from database
 * @param {string} section - Section name
 * @returns {string} Inline style string
 *
 * @example
 * <div style={getBackgroundStyleString(settings, 'hero')}>...</div>
 */
export const getBackgroundStyleString = (settings, section) => {
  const styleObj = getBackgroundStyle(settings, section);
  return Object.entries(styleObj)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
};

/**
 * Validate hex color format
 *
 * @param {string} color - Hex color string
 * @returns {boolean} True if valid hex color
 */
export const isValidHexColor = (color) => {
  if (!color) return false;
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
};

/**
 * Validate CSS gradient string (basic validation)
 *
 * @param {string} gradient - CSS gradient string
 * @returns {boolean} True if appears to be a valid gradient
 */
export const isValidGradient = (gradient) => {
  if (!gradient) return false;
  return /gradient\s*\(/.test(gradient);
};

/**
 * Validate image URL
 *
 * @param {string} url - Image URL
 * @returns {boolean} True if valid URL format
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    // Check for relative path or Supabase storage path
    return url.startsWith('/') || url.includes('supabase');
  }
};

/**
 * Validate background configuration for a section
 *
 * @param {Object} config - Background configuration object
 * @param {string} config.type - Background type ('solid', 'gradient', 'image', 'none')
 * @param {string} config.color - Hex color (for solid type)
 * @param {string} config.gradient - CSS gradient (for gradient type)
 * @param {string} config.imageUrl - Image URL (for image type)
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateBackgroundConfig = (config) => {
  const errors = [];

  // Validate type
  const validTypes = ['solid', 'gradient', 'image', 'none'];
  if (!config.type || !validTypes.includes(config.type)) {
    errors.push(`Invalid background type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Type-specific validation
  if (config.type === 'solid') {
    if (!config.color) {
      errors.push('Solid background requires a color value');
    } else if (!isValidHexColor(config.color)) {
      errors.push('Invalid hex color format. Use format: #RRGGBB');
    }
  }

  if (config.type === 'gradient') {
    if (!config.gradient) {
      errors.push('Gradient background requires a gradient value');
    } else if (!isValidGradient(config.gradient)) {
      errors.push('Invalid gradient format. Must contain "gradient("');
    }
  }

  if (config.type === 'image') {
    if (!config.imageUrl) {
      errors.push('Image background requires an image URL');
    } else if (!isValidImageUrl(config.imageUrl)) {
      errors.push('Invalid image URL format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create default background configuration for a section
 *
 * @param {string} section - Section name
 * @returns {Object} Default background config
 */
export const getDefaultBackgroundConfig = (section) => {
  const defaults = {
    hero: {
      type: 'solid',
      color: '#050509',
      gradient: null,
      imageUrl: null
    },
    gallery_section: {
      type: 'solid',
      color: '#050509',
      gradient: null,
      imageUrl: null
    },
    page: {
      type: 'solid',
      color: '#050509',
      gradient: null,
      imageUrl: null
    },
    hero_quote: {
      type: 'image',
      color: null,
      gradient: null,
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1920&q=80'
    },
    reservation_dark: {
      type: 'image',
      color: null,
      gradient: null,
      imageUrl: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920'
    },
    reservation_light: {
      type: 'solid',
      color: '#FAF5EF',
      gradient: null,
      imageUrl: null
    }
  };

  return defaults[section] || defaults.page;
};

/**
 * Convert background config to database column format
 *
 * @param {Object} config - Background configuration
 * @param {string} section - Section name
 * @returns {Object} Database column object
 *
 * @example
 * const dbData = configToDbFormat({ type: 'solid', color: '#000' }, 'hero');
 * // Returns: { hero_bg_type: 'solid', hero_bg_color: '#000', ... }
 */
export const configToDbFormat = (config, section) => {
  return {
    [`${section}_bg_type`]: config.type,
    [`${section}_bg_color`]: config.color || null,
    [`${section}_bg_gradient`]: config.gradient || null,
    [`${section}_bg_image_url`]: config.imageUrl || null
  };
};

/**
 * Convert database columns to background config object
 *
 * @param {Object} dbData - Database row data
 * @param {string} section - Section name
 * @returns {Object} Background configuration object
 */
export const dbFormatToConfig = (dbData, section) => {
  return {
    type: dbData[`${section}_bg_type`] || 'solid',
    color: dbData[`${section}_bg_color`] || null,
    gradient: dbData[`${section}_bg_gradient`] || null,
    imageUrl: dbData[`${section}_bg_image_url`] || null
  };
};

/**
 * Apply background overlay for better text readability
 *
 * @param {string} overlayColor - Overlay color (with alpha)
 * @param {number} overlayOpacity - Opacity (0-1)
 * @returns {Object} CSS style object for overlay
 */
export const getOverlayStyle = (overlayColor = '#000000', overlayOpacity = 0.4) => {
  // Convert hex to rgba if needed
  let rgba = overlayColor;
  if (overlayColor.startsWith('#')) {
    const r = parseInt(overlayColor.slice(1, 3), 16);
    const g = parseInt(overlayColor.slice(3, 5), 16);
    const b = parseInt(overlayColor.slice(5, 7), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${overlayOpacity})`;
  }

  return {
    position: 'relative',
    '::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: rgba,
      zIndex: 1
    }
  };
};

/**
 * Check if background is dark (for automatic text color adjustment)
 *
 * @param {string} color - Hex color
 * @returns {boolean} True if color is dark
 */
export const isDarkBackground = (color) => {
  if (!color || !color.startsWith('#')) return true;

  // Convert hex to RGB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5;
};

/**
 * Get recommended text color based on background
 *
 * @param {Object} backgroundStyle - Background style object
 * @returns {string} Recommended text color (hex)
 */
export const getRecommendedTextColor = (backgroundStyle) => {
  // For solid colors, analyze brightness
  if (backgroundStyle.background && backgroundStyle.background.startsWith('#')) {
    return isDarkBackground(backgroundStyle.background) ? '#F9FAFB' : '#111827';
  }

  // For gradients and images, default to light text with shadow
  return '#F9FAFB';
};
