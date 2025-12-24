import { useState, useEffect, useCallback } from 'react'
import StarRating from './StarRating'
import { createReview, uploadReviewImage } from '../lib/reviewsApi'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

/**
 * UploadResult interface
 */
interface UploadResult {
  success: boolean
  url?: string
  bucketMissing?: boolean
  error?: Error
}

/**
 * ReviewFormProps interface
 */
export interface ReviewFormProps {
  productId: string
  itemType?: 'product' | 'menu_item' | 'all'
  orderId?: string
  orderItemId?: string
  onSuccess?: (data: unknown, warning?: string) => void
  onCancel?: () => void
}

/**
 * ReviewForm Component
 *
 * Form for submitting a product review.
 * Only shown to verified purchasers who haven't reviewed the product yet.
 *
 * @param {ReviewFormProps} props - Component props
 */
function ReviewForm({
  productId,
  itemType = 'product',
  orderId,
  orderItemId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState<string>('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'))
    }

    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const MAX_IMAGES = 5
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const MAX_REVIEW_LENGTH = 1000

  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return

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
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result)
                } else {
                  reject(new Error(`Failed to read ${file.name}`))
                }
              }
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
    },
    [images]
  )

  const removeImage = useCallback(
    (index: number) => {
      setImages(images.filter((_, i) => i !== index))
      setImagePreviews(imagePreviews.filter((_, i) => i !== index))
    },
    [images, imagePreviews]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
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
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError('You must be logged in to submit a review')
          setLoading(false)
          return
        }

        if (import.meta.env?.DEV) {
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
        let imageUrls: string[] = []
        let imageUploadWarning = ''

        if (images.length > 0) {
          logger.log('=== UPLOADING REVIEW IMAGES ===')
          logger.log('Number of images to upload:', images.length)

          const uploadPromises = images.map(file => uploadReviewImage(file, user.id))
          const uploadResults = (await Promise.all(uploadPromises)) as UploadResult[]

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
              imageUploadWarning =
                '⚠️ WARNING: Image storage is not configured. Your review will be submitted WITHOUT images. To enable image uploads, create a "review-images" bucket in Supabase Storage.'
              logger.warn('Storage bucket not configured, proceeding without images')
              alert(
                '⚠️ IMPORTANT: Images cannot be uploaded because storage is not configured!\n\nYour review will be submitted WITHOUT images.\n\nTo fix: Create "review-images" bucket in Supabase Dashboard → Storage'
              )
            } else if (successfulUploads.length === 0) {
              // All uploads failed for other reasons
              setError(
                'Failed to upload images. You can submit your review without images or try again later.'
              )
              setLoading(false)
              return
            } else {
              // Some succeeded, use those
              imageUploadWarning = `⚠️ Note: ${failedUploads.length} image(s) failed to upload. Proceeding with ${successfulUploads.length} image(s).`
            }
          }

          imageUrls = successfulUploads.map(r => r.url).filter((url): url is string => !!url)
          logger.log('Final image URLs to save:', imageUrls)
        } else {
          logger.log('=== NO IMAGES SELECTED ===')
          logger.log('User did not select any images for this review')
        }

        // Create review
        logger.log('Calling createReview...')
        const result = await createReview({
          productId,
          menuItemId: itemType === 'menu_item' ? productId : undefined,
          itemType,
          userId: user.id,
          orderId,
          orderItemId,
          rating,
          reviewText: reviewText.trim(),
          reviewImages: imageUrls,
        })

        logger.log('createReview result:', result)

        if (!result.success) {
          let errorMessage = 'Failed to submit review. Please try again.'

          if (result.alreadyExists) {
            errorMessage = (result.message as string) || 'You have already reviewed this product'
          } else if (result.tableMissing) {
            errorMessage = (result.message as string) || 'Reviews table not found. Please contact support.'
          } else if (result.permissionDenied) {
            errorMessage =
              (result.message as string) || 'Permission denied. Only verified purchasers can review.'
          } else if (result.message) {
            errorMessage = result.message as string
          } else if (result.error) {
            const error = typeof result.error === 'string' ? result.error : result.error instanceof Error ? result.error.message : String(result.error)
            errorMessage = `Error: ${error}`
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

        const error = err as Error & { code?: string; message?: string }
        if (error.message?.includes('JWT') || error.message?.includes('token')) {
          errorMessage = 'Your session has expired. Please refresh the page and try again.'
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (error.code === '23505') {
          errorMessage = 'You have already reviewed this product from this purchase.'
        } else if (error.message) {
          errorMessage = error.message
        }

        setError(errorMessage)
        setLoading(false)
      }
    },
    [rating, reviewText, images, productId, itemType, orderId, orderItemId, onSuccess]
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl sm:rounded-2xl border border-[var(--border-default)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
      style={{
        backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
      }}
      aria-label="Review submission form"
    >
      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-4">
        Write a Review
      </h3>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 px-4 sm:px-6 py-3 sm:py-4 border-l-4 rounded-xl sm:rounded-2xl bg-[var(--status-error-bg)] border-[var(--status-error-border)]"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <svg
              className="w-5 h-5 text-[var(--color-red)] mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm sm:text-base font-medium text-[var(--color-red)]">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="mb-6">
        <label
          htmlFor="rating"
          className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2"
        >
          Your Rating{' '}
          <span className="text-[var(--color-red)]" aria-label="required">
            *
          </span>
        </label>
        <StarRating rating={rating} size="lg" interactive={true} onChange={setRating} />
      </div>

      {/* Review Text */}
      <div className="mb-6">
        <label
          htmlFor="reviewText"
          className="block text-sm sm:text-base font-medium text-[var(--text-main)] mb-2"
        >
          Your Review (optional)
        </label>
        <textarea
          id="reviewText"
          name="reviewText"
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          maxLength={MAX_REVIEW_LENGTH}
          rows={5}
          className="w-full min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          placeholder="Share your thoughts about this product..."
          aria-describedby="reviewText-help reviewText-count"
        />
        <div
          id="reviewText-help"
          className="mt-1 flex justify-between text-sm text-[var(--text-muted)]"
        >
          <span>Optional, but helpful for other customers</span>
          <span id="reviewText-count" aria-live="polite">
            {reviewText.length}/{MAX_REVIEW_LENGTH}
          </span>
        </div>
      </div>

      {/* Image Upload - PROMINENT */}
      <div className="mb-6 px-4 sm:px-6 py-3 sm:py-4 bg-[rgba(var(--color-blue-rgb),0.1)] border-2 border-[rgba(var(--color-blue-rgb),0.3)] rounded-xl sm:rounded-2xl">
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          <svg
            className="w-6 h-6 text-[var(--color-blue)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <label
            htmlFor="reviewImages"
            className="block text-sm sm:text-base font-semibold text-[var(--text-main)]"
          >
            Add Product Photos
            <span className="ml-2 text-sm text-[var(--text-muted)] font-normal">
              (Optional - but helpful!)
            </span>
          </label>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 ? (
          <div className="mb-4">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <svg
                className="w-4 h-4 text-[var(--color-emerald)]"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span
                className="text-sm sm:text-base font-medium text-[var(--color-emerald)]"
                aria-live="polite"
              >
                {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div
              className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4"
              role="list"
              aria-label="Image previews"
            >
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group" role="listitem">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-xl sm:rounded-2xl border-2 border-[var(--border-default)] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 min-h-[44px] min-w-[44px] bg-[var(--color-red)] text-[var(--text-main)] rounded-full p-1.5 hover:bg-[var(--color-red)]/90 transition cursor-pointer shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    title="Remove image"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 px-4 sm:px-6 py-3 sm:py-4 md:py-5 bg-[var(--bg-elevated)] border-2 border-dashed border-[rgba(var(--color-blue-rgb),0.3)] rounded-xl sm:rounded-2xl text-center">
            <svg
              className="w-12 h-12 text-[var(--color-blue)]/60 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm sm:text-base font-medium text-[var(--text-main)] mb-1">
              No images selected yet
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Add photos to show others what the product looks like!
            </p>
          </div>
        )}

        {/* Upload Button */}
        {images.length < MAX_IMAGES && (
          <label
            htmlFor="reviewImages"
            className="flex items-center justify-center gap-3 sm:gap-4 w-full min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-[var(--text-main)] rounded-xl sm:rounded-2xl transition cursor-pointer shadow-md hover:shadow-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>
              {images.length === 0
                ? 'Click to Add Photos'
                : `Add More Photos (${images.length}/${MAX_IMAGES})`}
            </span>
            <input
              id="reviewImages"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              aria-label="Select review images"
            />
          </label>
        )}

        <div className="mt-3 flex items-start gap-3 sm:gap-4">
          <svg
            className="w-4 h-4 text-[var(--color-blue)] mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            <strong>Tip:</strong> Upload up to {MAX_IMAGES} photos (max 5MB each). Photos help other
            customers see the product in real life!
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 sm:gap-4 md:gap-6">
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="flex-1 min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base bg-[var(--color-blue)] text-[var(--text-main)] rounded-xl sm:rounded-2xl hover:bg-[var(--color-blue)]/90 transition font-medium disabled:bg-[var(--text-muted)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label={loading ? 'Submitting review' : 'Submit review'}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="min-h-[44px] px-4 sm:px-6 py-3 text-sm sm:text-base bg-[var(--bg-elevated)] text-[var(--text-main)] rounded-xl sm:rounded-2xl transition font-medium cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          style={{
            backgroundColor: isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.04)' : undefined,
          }}
          onMouseEnter={e => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = isLightTheme
                ? 'rgba(var(--bg-dark-rgb), 0.08)'
                : 'rgba(var(--text-main-rgb), 0.1)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = isLightTheme
              ? 'rgba(var(--bg-dark-rgb), 0.04)'
              : ''
          }}
          aria-label="Cancel review"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default ReviewForm
