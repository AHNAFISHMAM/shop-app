import { buildPexelsImageUrl } from './pexelsUtils.js'

const BASE_URL = 'https://api.pexels.com/v1/search'

/**
 * Searches the Pexels API for photos matching the provided term.
 * Returns photo metadata with stable IDs for dedupe.
 *
 * @param {string} query
 * @param {{ perPage?: number, page?: number }} options
 * @returns {Promise<{ photos: Array<{ id: string, previewUrl: string, src: Record<string, string> }>, totalResults: number, nextPage: number | null }>}
 */
export async function searchFoodPhotos(query, options = {}) {
  if (!query || typeof query !== 'string') {
    throw new Error('searchFoodPhotos requires a non-empty query')
  }

  const apiKey = import.meta.env.VITE_PEXELS_API_KEY

  if (!apiKey) {
    throw new Error(
      'Missing VITE_PEXELS_API_KEY. Add it to your environment to enable auto image generation.'
    )
  }

  const { perPage = 6, page = 1 } = options

  const url = `${BASE_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`
  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Pexels API error (${response.status}): ${errorText || response.statusText}`)
  }

  const data = await response.json()
  const photos = (data.photos || []).map(photo => ({
    id: String(photo.id),
    previewUrl: photo.src?.medium || photo.src?.large || photo.src?.original || '',
    src: photo.src ?? {},
    photographer: photo.photographer,
    original: photo,
  }))

  return {
    photos,
    totalResults: data.total_results ?? 0,
    nextPage: data.next_page ? page + 1 : null,
  }
}

/**
 * Builds a canonical menu-ready URL for a Pexels photo ID.
 * @param {string | number} photoId
 * @param {{ width?: number, height?: number }} options
 * @returns {string}
 */
export function buildMenuImageUrl(photoId, options = {}) {
  return buildPexelsImageUrl(photoId, options)
}
