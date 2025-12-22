import { useState, ChangeEvent } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

interface AboutGalleryUploaderProps {
  onUploadSuccess?: (slotNumber: string, publicUrl: string, imageType: 'default' | 'hover') => void;
}

interface SelectedFiles {
  slot1_default: File | null;
  slot1_hover: File | null;
  slot2_default: File | null;
  slot2_hover: File | null;
  slot3_default: File | null;
  slot3_hover: File | null;
}

interface UploadingState {
  [key: string]: boolean;
}

interface CardPair {
  slot: string;
  label: string;
  animation: string;
  description: string;
}

/**
 * AboutGalleryUploader Component
 * Allows anonymous users to upload gallery images with hover effects for the About page
 *
 * Features:
 * - Upload six images (3 pairs: default + hover for each card)
 * - Card 1: Crossfade animation
 * - Card 2: Slide+Fade animation
 * - Card 3: Scale+Crossfade animation
 * - Client-side file validation (type, size)
 * - Anonymous upload to Supabase Storage
 * - Updates store_settings with new image URLs
 * - Toast notifications for success/error
 * - Accepts: .jpg, .png, .webp up to 5MB each
 */
function AboutGalleryUploader({ onUploadSuccess }: AboutGalleryUploaderProps): JSX.Element {
  const [uploading, setUploading] = useState<UploadingState>({})
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({
    slot1_default: null,
    slot1_hover: null,
    slot2_default: null,
    slot2_hover: null,
    slot3_default: null,
    slot3_hover: null
  })

  // Allowed file types
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): boolean => {
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
   * Handle file selection for a specific slot
   */
  const handleFileChange = (slot: keyof SelectedFiles, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file && validateFile(file)) {
      setSelectedFiles(prev => ({ ...prev, [slot]: file }))
    } else {
      setSelectedFiles(prev => ({ ...prev, [slot]: null }))
      e.target.value = '' // Reset input
    }
  }

  /**
   * Upload file to Supabase Storage and update store settings
   */
  const handleUpload = async (slot: string, imageType: 'default' | 'hover') => {
    const slotKey = `${slot}_${imageType}` as keyof SelectedFiles
    const file = selectedFiles[slotKey]

    if (!file) {
      toast.error('Please select a file first')
      return
    }

    const slotNumber = slot.replace('slot', '')
    const columnName = imageType === 'hover'
      ? `about_gallery_image_${slotNumber}_hover`
      : `about_gallery_image_${slotNumber}`

    try {
      setUploading(prev => ({ ...prev, [slotKey]: true }))

      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = imageType === 'hover'
        ? `about-gallery/${slotNumber}-hover-${timestamp}.${fileExt}`
        : `about-gallery/${slotNumber}-${timestamp}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('background-images')
        .upload(fileName, file, {
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

      // Update store_settings with new image URL
      const updateData = { [columnName]: publicUrl } as Record<string, unknown>;
      const { error: updateError } = await supabase
        .from('store_settings')
        .update(updateData as never)
        .eq('singleton_guard', true)

      if (updateError) {
        logger.error('Settings update error:', updateError)
        throw new Error(`Failed to update settings: ${updateError.message}`)
      }

      // Success!
      const displayType = imageType === 'hover' ? 'hover' : 'default'
      toast.success(`Card ${slotNumber} ${displayType} image uploaded successfully!`)

      // Reset form
      setSelectedFiles(prev => ({ ...prev, [slotKey]: null }))
      const inputElement = document.getElementById(`about-upload-${slotKey}`) as HTMLInputElement
      if (inputElement) {
        inputElement.value = ''
      }

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(slotNumber, publicUrl, imageType)
      }

    } catch (error) {
      logger.error('Upload process error:', error)
      const err = error as Error
      toast.error(err.message || `Failed to upload image`)
    } finally {
      setUploading(prev => ({ ...prev, [slotKey]: false }))
    }
  }

  // Card pairs with animation descriptions
  const cardPairs: CardPair[] = [
    {
      slot: 'slot1',
      label: 'Card 1',
      animation: 'Crossfade',
      description: 'Smooth opacity transition'
    },
    {
      slot: 'slot2',
      label: 'Card 2',
      animation: 'Slide + Fade',
      description: 'Slides in from left'
    },
    {
      slot: 'slot3',
      label: 'Card 3',
      animation: 'Scale + Crossfade',
      description: 'Zooms with fade'
    }
  ]

  // Render individual upload slot
  const renderUploadSlot = (slotKey: keyof SelectedFiles, label: string, imageType: 'default' | 'hover') => {
    const isUploading = uploading[slotKey]
    const hasFile = selectedFiles[slotKey]

    return (
      <div className="space-y-2">
        <label
          htmlFor={`about-upload-${slotKey}`}
          className="block text-xs font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </label>

        <input
          id={`about-upload-${slotKey}`}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(e) => handleFileChange(slotKey, e)}
          disabled={isUploading}
          className="block w-full text-xs rounded-lg border p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'var(--text-main)'
          }}
        />

        {hasFile && (
          <p className="text-xs" style={{ color: 'var(--accent)' }}>
            {hasFile.name.length > 25
              ? hasFile.name.substring(0, 25) + '...'
              : hasFile.name}
          </p>
        )}

        <button
          onClick={() => {
            const [slot] = slotKey.split('_')
            if (slot) {
              handleUpload(slot, imageType)
            }
          }}
          disabled={!hasFile || isUploading}
          className="w-full btn-primary text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div
      className="app-container py-6 rounded-2xl border backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
            Upload Gallery Images with Hover Effects
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Upload both default and hover images for each card. Each card has a unique animation effect. (JPG, PNG, or WebP, max 5MB each)
          </p>
        </div>

        {/* Card Pairs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {cardPairs.map(({ slot, label, animation, description }) => (
            <div
              key={slot}
              className="p-5 rounded-xl border"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="text-center pb-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>
                    {label}
                  </h4>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-main)' }}>
                    {animation}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {description}
                  </p>
                </div>

                {/* Default Image Upload */}
                {renderUploadSlot(`${slot}_default` as keyof SelectedFiles, 'Default Image', 'default')}

                {/* Hover Image Upload */}
                {renderUploadSlot(`${slot}_hover` as keyof SelectedFiles, 'Hover Image', 'hover')}
              </div>
            </div>
          ))}
        </div>

        {/* Info Text */}
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Both images are required for each card. Hover effects will be visible immediately on the About page.
        </p>
      </div>
    </div>
  )
}

export default AboutGalleryUploader

