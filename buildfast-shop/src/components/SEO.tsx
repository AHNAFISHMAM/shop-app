import { Helmet } from 'react-helmet-async'
import { useMemo } from 'react'

/**
 * SEO component props
 */
interface SEOProps {
  /** Page title (will be appended to site name) */
  title?: string
  /** Meta description */
  description?: string
  /** Open Graph image URL */
  image?: string
  /** Open Graph type (website, article, etc.) */
  type?: string
  /** Meta keywords (optional) */
  keywords?: string
}

/**
 * SEO Component
 *
 * Manages page metadata, Open Graph tags, and Twitter Cards.
 * Features:
 * - Dynamic page titles with site name
 * - Open Graph tags for social sharing
 * - Twitter Card support
 * - Default fallbacks for missing data
 * - Performance optimized (memoized values)
 */
export function SEO({ title, description, image, type = 'website', keywords }: SEOProps) {
  const defaultTitle = 'Star Café - Fine Dining Restaurant'
  const defaultDesc =
    'Experience authentic flavors and exceptional dining at Star Café. Discover our menu, make reservations, and enjoy fine dining in a warm, welcoming atmosphere.'

  const siteUrl = useMemo(() => {
    return typeof window !== 'undefined' ? window.location.origin : ''
  }, [])

  const currentUrl = useMemo(() => {
    return typeof window !== 'undefined' ? window.location.href : ''
  }, [])

  const ogImage = useMemo(() => {
    return image || `${siteUrl}/og-image.jpg`
  }, [image, siteUrl])

  const pageTitle = useMemo(() => {
    return title ? `${title} | ${defaultTitle}` : defaultTitle
  }, [title])

  const metaDescription = useMemo(() => {
    return description || defaultDesc
  }, [description])

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Star Café" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="Star Café" />
    </Helmet>
  )
}
