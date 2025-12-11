import { describe, it, expect } from 'vitest'
import { getQuoteBackgroundUrl, getDefaultBackgroundUrl } from './quoteBackgroundHelper'

describe('quoteBackgroundHelper', () => {
  const DEFAULT_URL = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'

  describe('getQuoteBackgroundUrl', () => {
    it('should return uploaded URL when settings has valid hero_quote_bg_url', () => {
      const settings = {
        hero_quote_bg_url: 'https://example.com/storage/v1/object/public/background-images/test.jpg'
      }

      const result = getQuoteBackgroundUrl(settings)

      expect(result).toBe('https://example.com/storage/v1/object/public/background-images/test.jpg')
    })

    it('should return fallback when settings is null', () => {
      const result = getQuoteBackgroundUrl(null)

      expect(result).toBe(DEFAULT_URL)
    })

    it('should return fallback when settings is undefined', () => {
      const result = getQuoteBackgroundUrl(undefined)

      expect(result).toBe(DEFAULT_URL)
    })

    it('should return fallback when hero_quote_bg_url is null', () => {
      const settings = {
        hero_quote_bg_url: null
      }

      const result = getQuoteBackgroundUrl(settings)

      expect(result).toBe(DEFAULT_URL)
    })

    it('should return fallback when hero_quote_bg_url is empty string', () => {
      const settings = {
        hero_quote_bg_url: ''
      }

      const result = getQuoteBackgroundUrl(settings)

      expect(result).toBe(DEFAULT_URL)
    })

    it('should return fallback when hero_quote_bg_url is whitespace only', () => {
      const settings = {
        hero_quote_bg_url: '   '
      }

      const result = getQuoteBackgroundUrl(settings)

      expect(result).toBe(DEFAULT_URL)
    })

    it('should return fallback when hero_quote_bg_url is not a string', () => {
      const settings = {
        hero_quote_bg_url: 12345
      }

      const result = getQuoteBackgroundUrl(settings)

      expect(result).toBe(DEFAULT_URL)
    })

    it('should return uploaded URL even with extra whitespace', () => {
      const settings = {
        hero_quote_bg_url: ' https://example.com/image.jpg '
      }

      const result = getQuoteBackgroundUrl(settings)

      // Note: trim() is not applied in current implementation
      // This test documents current behavior
      expect(result).toBe(' https://example.com/image.jpg ')
    })

    it('should handle settings with other properties', () => {
      const settings = {
        store_name: 'Star Café',
        tax_rate: 8.00,
        hero_quote_bg_url: 'https://example.com/custom-bg.png'
      }

      const result = getQuoteBackgroundUrl(settings)

      expect(result).toBe('https://example.com/custom-bg.png')
    })
  })

  describe('getDefaultBackgroundUrl', () => {
    it('should return default fallback URL', () => {
      const result = getDefaultBackgroundUrl()

      expect(result).toBe(DEFAULT_URL)
    })

    it('should return consistent value across multiple calls', () => {
      const result1 = getDefaultBackgroundUrl()
      const result2 = getDefaultBackgroundUrl()

      expect(result1).toBe(result2)
    })
  })
})
