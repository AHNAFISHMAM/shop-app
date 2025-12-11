import { useState } from 'react'
import PropTypes from 'prop-types'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

/**
 * AmbienceUploader Component
 * Allows anonymous users to upload background images for the hero quote section
 *
 * Features:
 * - Client-side file validation (type, size)
 * - Anonymous upload to Supabase Storage
 * - Updates store_settings with new background URL
 * - Toast notifications for success/error
 * - Accepts: .jpg, .png, .webp up to 5MB
 */
function AmbienceUploader({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  // Allowed file types
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

  /**
   * Validate file before upload
   */
  const validateFile = (file) => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG, or WebP image.')
      return false
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5MB.')
      return false
    }

    return true
  }

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]

    if (file && validateFile(file)) {
      setSelectedFile(file)
    } else {
      setSelectedFile(null)
      e.target.value = '' // Reset input
    }
  }

  /**
   * Upload file to Supabase Storage and update store settings
   */
  const handleUpload = async () => {
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
          upsert: false
        })

      if (uploadError) {
        logger.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('background-images')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      // Update store_settings with new background URL
      const { error: updateError } = await supabase
        .from('store_settings')
        .update({ hero_quote_bg_url: publicUrl })
        .eq('singleton_guard', true)

      if (updateError) {
        logger.error('Settings update error:', updateError)
        throw new Error(`Failed to update settings: ${updateError.message}`)
      }

      // Success!
      toast.success('Background image uploaded successfully!')

      // Reset form
      setSelectedFile(null)
      document.querySelector('input[type="file"]').value = ''

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(publicUrl)
      }

    } catch (error) {
      logger.error('Upload process error:', error)
      toast.error(error.message || 'Failed to upload background image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="max-w-md mx-auto p-6 rounded-2xl border backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
            Upload Custom Background
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Share your ambience. Upload a JPG, PNG, or WebP image (max 5MB)
          </p>
        </div>

        {/* File Input */}
        <div className="space-y-2">
          <label
            htmlFor="ambience-upload"
            className="block text-sm font-medium"
            style={{ color: 'var(--text-main)' }}
          >
            Choose Image
          </label>
          <input
            id="ambience-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm rounded-lg border p-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'var(--text-main)'
            }}
          />
          {selectedFile && (
            <p className="text-xs" style={{ color: 'var(--accent)' }}>
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full btn-primary text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Background
            </>
          )}
        </button>

        {/* Info Text */}
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Your upload will be visible immediately to all visitors
        </p>
      </div>
    </div>
  )
}

export default AmbienceUploader

AmbienceUploader.propTypes = {
  onUploadSuccess: PropTypes.func
}
