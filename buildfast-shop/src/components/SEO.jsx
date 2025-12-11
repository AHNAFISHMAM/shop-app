import { Helmet } from 'react-helmet-async';

/**
 * SEO Component
 * Manages page metadata, Open Graph tags, and Twitter Cards
 * 
 * @param {string} title - Page title (will be appended to site name)
 * @param {string} description - Meta description
 * @param {string} image - Open Graph image URL
 * @param {string} type - Open Graph type (website, article, etc.)
 * @param {string} keywords - Meta keywords (optional)
 */
export function SEO({ 
  title, 
  description, 
  image, 
  type = 'website',
  keywords
}) {
  const defaultTitle = 'Star Café - Fine Dining Restaurant';
  const defaultDesc = 'Experience authentic flavors and exceptional dining at Star Café. Discover our menu, make reservations, and enjoy fine dining in a warm, welcoming atmosphere.';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const ogImage = image || `${siteUrl}/og-image.jpg`;
  const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const metaDescription = description || defaultDesc;

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
  );
}

