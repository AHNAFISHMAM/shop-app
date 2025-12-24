import { memo, useCallback } from 'react'
import { m } from 'framer-motion'
import { fadeSlideUp } from '../animations/menuAnimations'

interface ProductImageGalleryProps {
  images: string[]
  selectedIndex: number
  onImageSelect: (index: number) => void
  productName: string
  prefersReducedMotion: boolean
}

const ProductImageGallery = memo(
  ({
    images,
    selectedIndex,
    onImageSelect,
    productName,
    prefersReducedMotion,
  }: ProductImageGalleryProps) => {
    const handleThumbnailClick = useCallback(
      (index: number) => {
        onImageSelect(index)
      },
      [onImageSelect]
    )

    if (!images || images.length === 0) {
      return (
        <div
          className="aspect-square rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center"
          role="img"
          aria-label={`${productName} - No image available`}
        >
          <span className="text-[var(--text-muted)]">No image</span>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Main Image */}
        <m.div
          className="aspect-square rounded-2xl overflow-hidden bg-[var(--bg-secondary)]"
          variants={prefersReducedMotion ? {} : fadeSlideUp}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate={prefersReducedMotion ? false : 'visible'}
          custom={0.1}
        >
          <img
            src={images[selectedIndex]}
            alt={`${productName} - Image ${selectedIndex + 1} of ${images.length}`}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </m.div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {images.map((image, index) => (
              <m.button
                key={index}
                type="button"
                onClick={() => handleThumbnailClick(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${
                  index === selectedIndex
                    ? 'border-[var(--accent)] opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                aria-label={`View ${productName} image ${index + 1}`}
                aria-pressed={index === selectedIndex}
              >
                <img
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </m.button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

ProductImageGallery.displayName = 'ProductImageGallery'

export default ProductImageGallery
