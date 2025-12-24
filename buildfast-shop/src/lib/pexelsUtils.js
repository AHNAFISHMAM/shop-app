const PHOTO_ID_REGEX = /photos\/(\d+)/i

/**
 * Extracts the numeric Pexels photo ID from a URL if present.
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export function extractPhotoId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(PHOTO_ID_REGEX)
  return match ? match[1] : null
}

/**
 * Builds a canonical Pexels image URL for a given photo ID.
 * @param {string | number} photoId
 * @param {{ width?: number, height?: number, format?: string, params?: Record<string,string> }} options
 * @returns {string}
 */
export function buildPexelsImageUrl(photoId, options = {}) {
  if (!photoId && photoId !== 0) {
    throw new Error('buildPexelsImageUrl requires a photoId')
  }

  const {
    width = 800,
    height = 600,
    format = 'jpeg',
    params = {
      auto: 'compress',
      cs: 'tinysrgb',
    },
  } = options

  const id = String(photoId).trim()
  const searchParams = new URLSearchParams({
    ...params,
    w: String(width),
  })

  if (height) {
    searchParams.set('h', String(height))
    searchParams.set('fit', 'crop')
  }

  const query = searchParams.toString()
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${format}?${query}`
}
