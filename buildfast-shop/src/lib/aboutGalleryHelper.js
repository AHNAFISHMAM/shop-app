/**
 * About Gallery Image Helper
 * Provides fallback logic for About page gallery images with hover support
 */

// Default fallback images from Unsplash
const DEFAULT_GALLERY_IMAGES = [
  {
    default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    hover: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600'
  },
  {
    default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
    hover: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600'
  },
  {
    default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    hover: 'https://images.unsplash.com/photo-1587899897387-091ebd01a6b2?w=600'
  }
]

/**
 * Validate and return image URL or fallback
 */
const getValidUrl = (url, fallback) => {
  return url && typeof url === 'string' && url.trim() !== '' ? url : fallback
}

/**
 * Get About page gallery images with fallback (includes default and hover)
 * @param {Object} settings - Store settings object from database
 * @returns {Array<{default: string, hover: string}>} Array of 3 image objects with default and hover URLs
 */
export function getAboutGalleryImages(settings) {
  if (!settings) {
    return DEFAULT_GALLERY_IMAGES
  }

  return [
    // Image 1: Crossfade animation
    {
      default: getValidUrl(settings.about_gallery_image_1, DEFAULT_GALLERY_IMAGES[0].default),
      hover: getValidUrl(settings.about_gallery_image_1_hover, DEFAULT_GALLERY_IMAGES[0].hover)
    },

    // Image 2: Slide+Fade animation
    {
      default: getValidUrl(settings.about_gallery_image_2, DEFAULT_GALLERY_IMAGES[1].default),
      hover: getValidUrl(settings.about_gallery_image_2_hover, DEFAULT_GALLERY_IMAGES[1].hover)
    },

    // Image 3: Scale+Crossfade animation
    {
      default: getValidUrl(settings.about_gallery_image_3, DEFAULT_GALLERY_IMAGES[2].default),
      hover: getValidUrl(settings.about_gallery_image_3_hover, DEFAULT_GALLERY_IMAGES[2].hover)
    }
  ]
}

/**
 * Get default gallery images
 * @returns {Array<{default: string, hover: string}>} Array of 3 default image objects
 */
export function getDefaultGalleryImages() {
  return DEFAULT_GALLERY_IMAGES
}
