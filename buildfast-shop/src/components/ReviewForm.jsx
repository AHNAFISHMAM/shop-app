import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import StarRating from './StarRating'
import { createReview, uploadReviewImage } from '../lib/reviewsApi'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

/**
 * ReviewForm Component
 *
 * Form for submitting a product review.
 * Only shown to verified purchasers who haven't reviewed the product yet.
 *
 * @param {string} productId - Product or menu item ID
 * @param {('product'|'menu_item'|'all')} itemType - Catalog type
 * @param {string} orderId - Order ID (for verification)
 * @param {string} orderItemId - Order item ID (for verification)
 * @param {Function} onSuccess - Callback when review is submitted successfully
 * @param {Function} onCancel - Callback when form is cancelled
 */
function ReviewForm({
  productId,
  itemType = 'product',
  orderId,
  orderItemId,
  onSuccess,
  onCancel
}) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const MAX_IMAGES = 5
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_REVIEW_LENGTH = 1000

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files)

    // Validate number of images
    if (images.length + files.length > MAX_IMAGES) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images`)
      return
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE)
    if (invalidFiles.length > 0) {
      setError('Each image must be less than 5MB')
      return
    }

    try {
      // Create previews
      const newPreviews = await Promise.all(
        files.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
            reader.readAsDataURL(file)
          })
        })
      )

      setImages([...images, ...files])
      setImagePreviews([...imagePreviews, ...newPreviews])
      setError('')
    } catch (error) {
      logger.error('Error reading image files:', error)
      setError('Failed to read one or more image files. Please try again.')
    }
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (rating === 0) {
      setError('Please select a star rating')
      return
    }

    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to submit a review')
        setLoading(false)
        return
      }

      if (import.meta.env.DEV) {
        logger.log('=== REVIEW SUBMISSION DEBUG ===')
        logger.log('User ID:', user.id)
        logger.log('Product ID:', productId)
        logger.log('Item Type:', itemType)
        logger.log('Order ID:', orderId)
        logger.log('Order Item ID:', orderItemId)
        logger.log('Rating:', rating)
        logger.log('Review Text:', reviewText)
        logger.log('Images to upload:', images.length)
      }

      // Upload images if any
      let imageUrls = []
      let imageUploadWarning = ''

      if (images.length > 0) {
        logger.log('=== UPLOADING REVIEW IMAGES ===')
        logger.log('Number of images to upload:', images.length)

        const uploadPromises = images.map(file => uploadReviewImage(file, user.id))
        const uploadResults = await Promise.all(uploadPromises)

        logger.log('Upload results:', uploadResults)

        // Check for upload errors
        const failedUploads = uploadResults.filter(r => !r.success)
        const successfulUploads = uploadResults.filter(r => r.success)

        logger.log('Successful uploads:', successfulUploads.length)
        logger.log('Failed uploads:', failedUploads.length)

        if (failedUploads.length > 0) {
          // Check if it's because bucket doesn't exist
          const bucketMissing = failedUploads.some(r => r.bucketMissing)

          if (bucketMissing) {
            // Allow review without images if storage is not configured
            imageUploadWarning = '⚠️ WARNING: Image storage is not configured. Your review will be submitted WITHOUT images. To enable image uploads, create a "review-images" bucket in Supabase Storage.'
            logger.warn('Storage bucket not configured, proceeding without images')
            alert('⚠️ IMPORTANT: Images cannot be uploaded because storage is not configured!\n\nYour review will be submitted WITHOUT images.\n\nTo fix: Create "review-images" bucket in Supabase Dashboard → Storage')
          } else if (successfulUploads.length === 0) {
            // All uploads failed for other reasons
            setError('Failed to upload images. You can submit your review without images or try again later.')
            setLoading(false)
            return
          } else {
            // Some succeeded, use those
            imageUploadWarning = `⚠️ Note: ${failedUploads.length} image(s) failed to upload. Proceeding with ${successfulUploads.length} image(s).`
          }
        }

        imageUrls = successfulUploads.map(r => r.url)
        logger.log('Final image URLs to save:', imageUrls)
      } else {
        logger.log('=== NO IMAGES SELECTED ===')
        logger.log('User did not select any images for this review')
      }

      // Create review
      logger.log('Calling createReview...')
      const result = await createReview({
        productId,
        menuItemId: itemType === 'menu_item' ? productId : null,
        itemType,
        userId: user.id,
        orderId,
        orderItemId,
        rating,
        reviewText: reviewText.trim(),
        reviewImages: imageUrls
      })

      logger.log('createReview result:', result)

      if (!result.success) {
        let errorMessage = 'Failed to submit review. Please try again.'

        if (result.alreadyExists) {
          errorMessage = result.message || 'You have already reviewed this product'
        } else if (result.tableMissing) {
          errorMessage = result.message || 'Reviews table not found. Please contact support.'
        } else if (result.permissionDenied) {
          errorMessage = result.message || 'Permission denied. Only verified purchasers can review.'
        } else if (result.message) {
          errorMessage = result.message
        } else if (result.error) {
          errorMessage = `Error: ${result.error.message || result.error.code || 'Unknown error'}`
        }

        logger.error('Review submission failed:', errorMessage)
        setError(errorMessage)
        setLoading(false)
        return
      }

      // Success!
      if (onSuccess) {
        onSuccess(result.data, imageUploadWarning)
      }
    } catch (err) {
      logger.error('Error submitting review:', err)

      // Provide more specific error messages
      let errorMessage = 'An unexpected error occurred. Please try again.'

      if (err.message?.includes('JWT') || err.message?.includes('token')) {
        errorMessage = 'Your session has expired. Please refresh the page and try again.'
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (err.code === '23505') {
        errorMessage = 'You have already reviewed this product from this purchase.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className="rounded-xl sm:rounded-2xl border border-theme px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
      style={{
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(5, 5, 9, 0.95)'
      }}
    >
      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">Write a Review</h3>

      {/* Error Message */}
      {error && (
        <div className="mb-4 px-4 sm:px-6 py-3 sm:py-4 bg-red-50 border-l-4 border-red-500 rounded-xl sm:rounded-2xl">
          <div className="flex items-start gap-3 sm:gap-4">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm sm:text-base font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive={true}
          onChange={setRating}
        />
      </div>

      {/* Review Text */}
      <div className="mb-6">
        <label htmlFor="reviewText" className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2">
          Your Review (optional)
        </label>
        <textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={MAX_REVIEW_LENGTH}
          rows={5}
          className="w-full min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base border border-theme bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Share your thoughts about this product..."
        />
        <div className="mt-1 flex justify-between text-[10px] sm:text-xs text-[var(--text-muted)]">
          <span>Optional, but helpful for other customers</span>
          <span>{reviewText.length}/{MAX_REVIEW_LENGTH}</span>
        </div>
      </div>

      {/* Image Upload - PROMINENT */}
      <div className="mb-6 px-4 sm:px-6 py-3 sm:py-4 bg-blue-600/10 border-2 border-blue-600/30 rounded-xl sm:rounded-2xl">
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <label className="block text-sm sm:text-base font-semibold text-[var(--text-main)]">
            Add Product Photos
            <span className="ml-2 text-[10px] sm:text-xs text-[var(--text-muted)] font-normal">(Optional - but helpful!)</span>
          </label>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 ? (
          <div className="mb-4">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base font-medium text-green-700">
                {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-xl sm:rounded-2xl border-2 border-theme shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 min-h-[44px] bg-red-500 text-black rounded-full p-1.5 hover:bg-red-600 transition cursor-pointer shadow-lg"
                    title="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 px-4 sm:px-6 py-3 sm:py-4 md:py-5 bg-theme-elevated border-2 border-dashed border-blue-600/30 rounded-xl sm:rounded-2xl text-center">
            <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">No images selected yet</p>
            <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">Add photos to show others what the product looks like!</p>
          </div>
        )}

        {/* Upload Button */}
        {images.length < MAX_IMAGES && (
          <label className="flex items-center justify-center gap-3 sm:gap-4 w-full min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-black rounded-xl sm:rounded-2xl transition cursor-pointer shadow-md hover:shadow-lg font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{images.length === 0 ? 'Click to Add Photos' : `Add More Photos (${images.length}/${MAX_IMAGES})`}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        )}

        <div className="mt-3 flex items-start gap-3 sm:gap-4">
          <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-[10px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
            <strong>Tip:</strong> Upload up to {MAX_IMAGES} photos (max 5MB each). Photos help other customers see the product in real life!
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 sm:gap-4 md:gap-6">
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="flex-1 min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base bg-blue-600 text-black rounded-xl sm:rounded-2xl hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base bg-theme-elevated text-[var(--text-main)] rounded-xl sm:rounded-2xl transition font-medium cursor-pointer"
          style={{
            backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isLightTheme 
              ? 'rgba(0, 0, 0, 0.08)' 
              : 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isLightTheme 
              ? 'rgba(0, 0, 0, 0.04)' 
              : '';
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default ReviewForm

ReviewForm.propTypes = {
  productId: PropTypes.string.isRequired,
  itemType: PropTypes.oneOf(['product', 'menu_item', 'all']),
  orderId: PropTypes.string,
  orderItemId: PropTypes.string,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
}
