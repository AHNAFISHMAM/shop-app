import { useEffect, useMemo, useState, useRef, ChangeEvent, DragEvent } from 'react'
import { createPortal } from 'react-dom'
import { uploadMenuImage, compressImage } from '../../lib/imageUtils'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { logger } from '../../utils/logger'
import { Button } from '../ui/button'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onImageUploaded: (url: string) => void
  dishName: string
}

interface Metadata {
  title: string
  altText: string
  keywords: string
  campaign: string
  usageRights: string
}

interface LibraryImage {
  url: string
  name: string
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onImageUploaded,
  dishName,
}: ImageUploadModalProps): JSX.Element | null {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [metadata, setMetadata] = useState<Metadata>({
    title: '',
    altText: '',
    keywords: '',
    campaign: '',
    usageRights: '',
  })
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Body scroll lock
  useBodyScrollLock(isOpen)

  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('theme-light')
  })

  // Watch for theme changes
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
  }, [isOpen])

  // Keyboard handler (Escape to close)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    setMetadata(prev => ({
      ...prev,
      title: prev.title || dishName,
      altText: prev.altText || dishName,
    }))

    let active = true

    async function loadLibrary() {
      try {
        setLibraryLoading(true)
        setLibraryError('')

        const { data, error } = await supabase
          .from('menu_items')
          .select('id, name, image_url')
          .not('image_url', 'is', null)
          .limit(200)

        if (error) throw error

        if (!active) return

        const unique: LibraryImage[] = []
        const seen = new Set<string>()

        data.forEach((item: { image_url?: string | null; name?: string | null }) => {
          const url = item.image_url?.trim()
          if (!url || seen.has(url)) return
          seen.add(url)
          unique.push({
            url,
            name: item.name || '',
          })
        })

        setLibraryImages(unique)
      } catch (error) {
        logger.error('Failed to load image library:', error)
        const err = error as Error
        setLibraryError(err.message || 'Unable to load image library')
        setLibraryImages([])
      } finally {
        if (active) {
          setLibraryLoading(false)
        }
      }
    }

    loadLibrary()

    return () => {
      active = false
    }
  }, [dishName, isOpen])

  // Handle file selection
  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  // Handle drag events
  function handleDrag(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  // Upload image
  async function handleUpload() {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }

    try {
      setUploading(true)

      // Compress image before upload
      const compressedFile = await compressImage(selectedFile)

      const preparedMetadata = {
        title: metadata.title.trim() || dishName,
        altText: metadata.altText.trim() || dishName,
        keywords: metadata.keywords
          .split(',')
          .map(keyword => keyword.trim())
          .filter(Boolean),
        campaign: metadata.campaign.trim() || null,
        usageRights: metadata.usageRights.trim() || null,
      }

      // Upload to Supabase with metadata
      const result = await uploadMenuImage(compressedFile, dishName, preparedMetadata)

      if (result.success && result.url) {
        if (result.duplicate) {
          toast.success('Image already exists. Reusing approved asset.')
        } else {
          toast.success('Image uploaded successfully')
        }
        onImageUploaded(result.url)
        handleClose()
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (error) {
      logger.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  // Close modal
  function handleClose() {
    setSelectedFile(null)
    setPreview(null)
    setDragActive(false)
    setMetadata({
      title: '',
      altText: '',
      keywords: '',
      campaign: '',
      usageRights: '',
    })
    onClose()
  }

  function handleMetadataChange(field: keyof Metadata, value: string) {
    setMetadata(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleUseExisting(url: string) {
    if (!url) return
    onImageUploaded(url)
    toast.success('Image reassigned from library')
    handleClose()
  }

  const filteredLibrary = useMemo(() => {
    if (!metadata.keywords.trim()) return libraryImages
    const searchTerms = metadata.keywords
      .toLowerCase()
      .split(',')
      .map(term => term.trim())
      .filter(Boolean)

    if (searchTerms.length === 0) return libraryImages

    return libraryImages.filter(item =>
      searchTerms.some(
        term => item.name.toLowerCase().includes(term) || item.url.toLowerCase().includes(term)
      )
    )
  }, [libraryImages, metadata.keywords])

  // Ensure we can render at body level (SSR safety)
  if (typeof document === 'undefined' || !document.body) {
    return null
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center backdrop-blur-sm p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-upload-modal-title"
      onClick={handleClose}
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        className="relative flex w-full max-w-lg flex-col rounded-xl border border-[var(--border-default)] overflow-hidden"
        style={{
          backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
          boxShadow: isLightTheme
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 99999,
          maxHeight: 'calc(100vh - 2rem)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header with Close Button - Mobile-First Design */}
        <div
          className="sticky top-0 z-[100] flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-main)]/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
          style={{
            position: 'sticky',
            top: 0,
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        >
          {/* Title */}
          <div className="flex-1 min-w-0 pr-3">
            <h2
              id="image-upload-modal-title"
              className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight truncate"
            >
              Upload Image
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 hidden sm:block">
              Uploading image for:{' '}
              <span className="font-semibold text-[var(--accent)]">{dishName}</span>
            </p>
          </div>

          {/* Close Button - Always visible and accessible */}
          <Button
            type="button"
            onClick={handleClose}
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            className="flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-[var(--bg-main)]/90 backdrop-blur-sm border border-[var(--border-default)] hover:bg-[var(--bg-hover)] shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            style={{
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 101,
            }}
            aria-label="Close image upload modal"
          >
            <svg
              className="w-5 h-5 text-[var(--text-main)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Scrollable Content - Below header */}
        <div
          data-overlay-scroll
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6"
          style={{
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Mobile-only dish name */}
          <div className="mb-4 sm:hidden">
            <p className="text-sm text-[var(--text-muted)]">
              Uploading image for:{' '}
              <span className="font-semibold text-[var(--accent)]">{dishName}</span>
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 mb-4 text-center transition-all ${
              dragActive ? 'border-gold bg-gold/10' : 'border-gray-800 hover:border-gray-700'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {preview ? (
              <div>
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg mb-4" />
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                  }}
                  className="text-sm text-text-muted hover:text-gold"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">📸</div>
                <p className="text-text-main font-semibold mb-2">Drag & drop image here</p>
                <p className="text-sm text-text-muted mb-4">or</p>
                <label className="btn-outline cursor-pointer inline-block">
                  Browse Files
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-text-muted mt-4">
                  Supported: JPG, PNG, WEBP, GIF (Max 5MB)
                </p>
              </div>
            )}
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="bg-dark-bg border border-gray-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">File:</span>
                <span className="text-text-main">{selectedFile.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-text-muted">Size:</span>
                <span className="text-text-main">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-text-muted">Type:</span>
                <span className="text-text-main">{selectedFile.type || 'Unknown'}</span>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-dark-bg border border-gray-800 rounded-lg p-4 mb-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                Title
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={e => handleMetadataChange('title', e.target.value)}
                placeholder="e.g., Signature Chicken Parmesan"
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-gray-700 text-text-main focus:outline-none focus:border-gold text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={metadata.altText}
                onChange={e => handleMetadataChange('altText', e.target.value)}
                placeholder="Describe how this dish appears"
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-gray-700 text-text-main focus:outline-none focus:border-gold text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                Keywords
              </label>
              <input
                type="text"
                value={metadata.keywords}
                onChange={e => handleMetadataChange('keywords', e.target.value)}
                placeholder="Comma-separated tags (e.g., chicken, pasta, dinner)"
                className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-gray-700 text-text-main focus:outline-none focus:border-gold text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                  Campaign / Collection
                </label>
                <input
                  type="text"
                  value={metadata.campaign}
                  onChange={e => handleMetadataChange('campaign', e.target.value)}
                  placeholder="Optional grouping label"
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-gray-700 text-text-main focus:outline-none focus:border-gold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                  Usage Rights / License
                </label>
                <input
                  type="text"
                  value={metadata.usageRights}
                  onChange={e => handleMetadataChange('usageRights', e.target.value)}
                  placeholder="e.g., Royalty-free, CC BY-SA"
                  className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-gray-700 text-text-main focus:outline-none focus:border-gold text-sm"
                />
              </div>
            </div>
            <p className="text-[11px] text-text-muted">
              Keywords help when searching the media library later. Usage rights ensure future
              admins know where this asset may appear.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </span>
              ) : (
                'Upload Image'
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          {/* Tips */}
          <div className="mt-4 p-3 bg-dark-bg border border-gray-800 rounded-lg">
            <p className="text-xs text-gold font-semibold mb-1">💡 Tips:</p>
            <ul className="text-xs text-text-muted space-y-1">
              <li>• Use high-quality images (at least 800x600px)</li>
              <li>• Images are automatically compressed for web</li>
              <li>• Square or landscape orientation works best</li>
            </ul>
          </div>

          {/* Existing Library */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-main uppercase tracking-wide">
                Reuse Approved Image
              </h3>
              {libraryLoading && (
                <span className="text-[11px] text-text-muted flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-text-muted"></div>
                  Loading...
                </span>
              )}
            </div>

            {libraryError && (
              <div className="text-xs text-red-400 bg-red-900/20 border border-red-700 rounded-lg p-3 mb-3">
                {libraryError}
              </div>
            )}

            {!libraryLoading && filteredLibrary.length === 0 && (
              <p className="text-xs text-text-muted">
                No reusable images found. Adjust keywords or upload a new image.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {filteredLibrary.slice(0, 12).map(item => (
                <button
                  key={item.url}
                  onClick={() => handleUseExisting(item.url)}
                  className="group border border-gray-800 bg-dark-bg rounded-lg overflow-hidden text-left hover:border-gold transition-colors"
                  type="button"
                >
                  <div className="h-24 bg-dark-bg">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-text-main line-clamp-2">{item.name}</p>
                    <p className="text-[11px] text-text-muted mt-1">Tap to reuse this image</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render modal at document.body level using Portal
  return createPortal(modalContent, document.body)
}
