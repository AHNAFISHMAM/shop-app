import { useState, useCallback, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

/**
 * AmbienceUploader component props
 */
interface AmbienceUploaderProps {
  /** Callback when upload succeeds */
  onUploadSuccess?: (url: string) => void
}

/**
 * Allowed file types
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * AmbienceUploader Component
 *
 * Allows anonymous users to upload background images for the hero quote section.
 *
 * Features:
 * - Client-side file validation (type, size)
 * - Anonymous upload to Supabase Storage
 * - Updates store_settings with new background URL
 * - Toast notifications for success/error
 * - Accepts: .jpg, .png, .webp up to 5MB
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 */
function AmbienceUploader({ onUploadSuccess }: AmbienceUploaderProps) {
  const [uploading, setUploading] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      toast.error('Invalid file type. Please upload a JPG, PNG, or WebP image.')
      return false
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5MB.')
      return false
    }

    return true
  }, [])

  /**
   * Handle file selection
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]

      if (file && validateFile(file)) {
        setSelectedFile(file)
      } else {
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = '' // Reset input
        }
      }
    },
    [validateFile]
  )

  /**
   * Upload file to Supabase Storage and update store settings
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    try {
      setUploading(true)

      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `hero-quotes/${timestamp}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('background-images')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        logger.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('background-images').getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // Update store_settings with new background URL
      const { error: updateError } = await supabase
        .from('store_settings')
        .update({ hero_quote_bg_url: publicUrl } as never)
        .eq('singleton_guard', true)

      if (updateError) {
        logger.error('Settings update error:', updateError)
        throw new Error(`Failed to update settings: ${updateError.message}`)
      }

      // Success!
      toast.success('Background image uploaded successfully!')

      // Reset form
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(publicUrl)
      }
    } catch (error) {
      logger.error('Upload process error:', error)
      const errorMessage =
        error instanceof Error
          ? error instanceof Error
            ? error instanceof Error
              ? error instanceof Error
                ? error instanceof Error
                  ? error instanceof Error
                    ? error instanceof Error
                      ? error instanceof Error
                        ? error instanceof Error
                          ? error instanceof Error
                            ? error instanceof Error
                              ? error instanceof Error
                                ? error instanceof Error
                                  ? error instanceof Error
                                    ? error instanceof Error
                                      ? error.message
                                      : String(error)
                                    : String(error)
                                  : String(error)
                                : String(error)
                              : String(error)
                            : String(error)
                          : String(error)
                        : String(error)
                      : String(error)
                    : String(error)
                  : String(error)
                : String(error)
              : String(error)
            : String(error)
          : 'Failed to upload background image'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }, [selectedFile, onUploadSuccess])

  const fileSizeMB = useMemo(() => {
    return selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0'
  }, [selectedFile])

  const isDisabled = useMemo(() => !selectedFile || uploading, [selectedFile, uploading])

  return (
    <div
      className="max-w-md mx-auto p-6 rounded-2xl border backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(var(--text-main-rgb), 0.03)',
        borderColor: 'rgba(var(--text-main-rgb), 0.1)',
      }}
      role="region"
      aria-labelledby="ambience-uploader-heading"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h3
            id="ambience-uploader-heading"
            className="text-lg font-semibold mb-2 text-[var(--text-main)]"
          >
            Upload Custom Background
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Share your ambience. Upload a JPG, PNG, or WebP image (max 5MB)
          </p>
        </div>

        {/* File Input */}
        <div className="space-y-2">
          <label
            htmlFor="ambience-upload"
            className="block text-sm font-medium text-[var(--text-main)]"
          >
            Choose Image
          </label>
          <input
            id="ambience-upload"
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm rounded-lg border p-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            style={{
              backgroundColor: 'rgba(var(--text-main-rgb), 0.05)',
              borderColor: 'rgba(var(--text-main-rgb), 0.2)',
              color: 'var(--text-main)',
            }}
            aria-describedby="file-input-help"
          />
          <span id="file-input-help" className="sr-only">
            Select a JPG, PNG, or WebP image file up to 5MB in size
          </span>
          {selectedFile && (
            <p className="text-sm text-[var(--accent)]" role="status" aria-live="polite">
              Selected: {selectedFile.name} ({fileSizeMB} MB)
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={isDisabled}
          className="w-full bg-[var(--accent)] text-black text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] rounded-lg font-medium transition-colors hover:bg-[var(--accent)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          aria-label={uploading ? 'Uploading background image' : 'Upload background image'}
          aria-busy={uploading}
        >
          {uploading ? (
            <>
              <div
                className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Uploading...
            </>
          ) : (
            <>
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Background
            </>
          )}
        </button>

        {/* Info Text */}
        <p className="text-sm text-center text-[var(--text-muted)]">
          Your upload will be visible immediately to all visitors
        </p>
      </div>
    </div>
  )
}

export default AmbienceUploader
