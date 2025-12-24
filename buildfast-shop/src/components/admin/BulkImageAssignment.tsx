import { useEffect, useMemo, useRef, useState, ChangeEvent, DragEvent } from 'react'
import toast from 'react-hot-toast'
import { uploadMultipleImages, autoMatchImages, compressImage } from '../../lib/imageUtils'
import { searchFoodPhotos, buildMenuImageUrl } from '../../lib/pexelsService'
import { extractPhotoId } from '../../lib/pexelsUtils'
import { logger } from '../../utils/logger'
import CustomDropdown from '../ui/CustomDropdown'
import type { MenuItem } from '../../lib/database.types'

interface BulkImageAssignmentProps {
  isOpen: boolean
  onClose: () => void
  menuItems: MenuItem[]
  filteredItems?: MenuItem[]
  onBulkAssign: (
    assignments: Array<{ menuItemId: string | number; imageUrl: string }>
  ) => Promise<void>
  onBulkDelete?: (options: { scope: string; itemIds: string[] | number[] }) => Promise<void>
}

interface Tab {
  id: string
  label: string
}

interface Scope {
  id: string
  label: string
}

interface UploadResult {
  fileName: string
  url: string
  success: boolean
  duplicate?: boolean
  [key: string]: unknown
}

interface Match {
  file: UploadResult
  menuItem: MenuItem
}

interface Photo {
  id: string
  previewUrl: string
  photographer?: string
  src: Record<string, string>
  original: unknown
}

interface GenerationStatus {
  [key: string]: 'queued' | 'fetching' | 'success' | 'duplicate' | 'manual' | 'skipped' | 'failed'
}

interface GenerationSummary {
  success: number
  fail: number
  fallback: number
}

interface Assignment {
  menuItemId: string | number
  imageUrl: string
  photoId?: string
  duplicate?: boolean
}

interface ScopeCounts {
  selected: number
  filtered: number
  all: number
  missing: number
}

const TABS: Tab[] = [
  { id: 'auto', label: 'Auto Generate' },
  { id: 'search', label: 'Search & Assign' },
  { id: 'upload', label: 'Manual Upload' },
  { id: 'bulk', label: 'Bulk Tools' },
]

const GENERATION_SCOPES: Scope[] = [
  { id: 'missing', label: 'Only missing images' },
  { id: 'selected', label: 'Only selected items' },
  { id: 'filtered', label: 'Current filtered list' },
  { id: 'all', label: 'All menu items' },
]

const DELETE_SCOPES: Scope[] = [
  { id: 'selected', label: 'Selected items' },
  { id: 'filtered', label: 'Current filtered list' },
  { id: 'all', label: 'All menu items' },
]

const BATCH_SIZE = 10
const delay = (ms = 200): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export default function BulkImageAssignment({
  isOpen,
  onClose,
  menuItems,
  filteredItems,
  onBulkAssign,
  onBulkDelete,
}: BulkImageAssignmentProps): JSX.Element | null {
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

  const [activeTab, setActiveTab] = useState('auto')

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadResult[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [unmatched, setUnmatched] = useState<UploadResult[]>([])
  const [manualAssignments, setManualAssignments] = useState<Record<number, string | number>>({})
  const [dragActive, setDragActive] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [cancelGeneration, setCancelGeneration] = useState(false)
  const [pauseGeneration, setPauseGeneration] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const [generationScope, setGenerationScope] = useState('missing')
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({})
  const [generationSummary, setGenerationSummary] = useState<GenerationSummary>({
    success: 0,
    fail: 0,
    fallback: 0,
  })
  const [batchMessage, setBatchMessage] = useState('')

  const [selectedItemIds, setSelectedItemIds] = useState<Array<string | number>>([])
  const [deleteScope, setDeleteScope] = useState('selected')
  const [deleteInProgress, setDeleteInProgress] = useState(false)

  const [pexelsQuery, setPexelsQuery] = useState('')
  const [pexelsResults, setPexelsResults] = useState<Photo[]>([])
  const [pexelsLoading, setPexelsLoading] = useState(false)
  const [pexelsPage, setPexelsPage] = useState(1)
  const [pexelsTotal, setPexelsTotal] = useState(0)
  const [pexelsHasMore, setPexelsHasMore] = useState(false)
  const [searchTargetId, setSearchTargetId] = useState<string | number>('')

  const pauseRef = useRef(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    pauseRef.current = pauseGeneration
  }, [pauseGeneration])

  useEffect(() => {
    cancelRef.current = cancelGeneration
  }, [cancelGeneration])

  const allMenuItems = useMemo(() => menuItems || [], [menuItems])
  const selectionPool = useMemo(() => {
    if (filteredItems && filteredItems.length > 0) {
      return filteredItems
    }
    return allMenuItems
  }, [filteredItems, allMenuItems])

  const selectionCount = selectedItemIds.length

  useEffect(() => {
    if (!isOpen) return
    setSelectedItemIds(prev => {
      const validIds = prev.filter(id => allMenuItems.some(item => item.id === id))
      if (validIds.length > 0) {
        return validIds
      }
      return selectionPool.map(item => item.id)
    })
  }, [isOpen, selectionPool, allMenuItems])

  useEffect(() => {
    if (selectedItemIds.length === 1) {
      const firstId = selectedItemIds[0]
      if (firstId !== undefined) {
        setSearchTargetId(firstId)
      }
      return
    }

    const currentExists = allMenuItems.some(item => item.id === searchTargetId)
    if (!currentExists) {
      const fallbackTarget = selectionPool[0]?.id || allMenuItems[0]?.id || ''
      setSearchTargetId(fallbackTarget || '')
    }
  }, [selectedItemIds, searchTargetId, selectionPool, allMenuItems])

  const existingPhotoIds = useMemo(() => {
    const ids = new Set<string>()
    allMenuItems.forEach(item => {
      const id = extractPhotoId(item?.image_url)
      if (id) {
        ids.add(id)
      }
    })
    return ids
  }, [allMenuItems])

  const selectedItems = useMemo(
    () => allMenuItems.filter(item => selectedItemIds.includes(item.id)),
    [allMenuItems, selectedItemIds]
  )

  const selectedItemNames = selectedItems.map(item => item.name)

  function toggleItemSelection(itemId: string | number): void {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  function applySelectionPreset(preset: string): void {
    if (preset === 'filtered') {
      setSelectedItemIds(selectionPool.map(item => item.id))
      return
    }
    if (preset === 'all') {
      setSelectedItemIds(allMenuItems.map(item => item.id))
      return
    }
    setSelectedItemIds([])
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  function handleDrag(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles(files)
    }
  }

  async function fetchUniquePhoto(
    menuItem: MenuItem,
    usedPhotoIds: Set<string>
  ): Promise<Assignment | null> {
    const MAX_ATTEMPTS = 5
    let page = 1
    let fallbackPhoto: Photo | null = null

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const searchQuery = `${menuItem.name} food dish`
      logger.log(`Attempt ${attempt + 1}/${MAX_ATTEMPTS} for "${menuItem.name}" (page ${page})`)

      try {
        const { photos, nextPage } = await searchFoodPhotos(searchQuery, { perPage: 6, page })

        if (!photos.length) {
          logger.warn(`No photos returned for "${menuItem.name}" on page ${page}`)
          if (!nextPage) break
          page = nextPage
          continue
        }

        if (!fallbackPhoto && photos[0]) {
          const pexelsPhoto = photos[0]
          fallbackPhoto = {
            id: pexelsPhoto.id,
            previewUrl: pexelsPhoto.previewUrl,
            src: pexelsPhoto.src,
            photographer: pexelsPhoto.photographer,
            original: pexelsPhoto.original,
          }
        }

        const uniqueCandidate = photos.find(photo => !usedPhotoIds.has(photo.id))

        if (uniqueCandidate) {
          usedPhotoIds.add(uniqueCandidate.id)
          return {
            menuItemId: menuItem.id,
            imageUrl: buildMenuImageUrl(uniqueCandidate.id),
            photoId: uniqueCandidate.id,
            duplicate: false,
          }
        }

        if (!nextPage) {
          logger.warn(`Exhausted pages for "${menuItem.name}" without finding unique photo.`)
          break
        }

        page = nextPage
      } catch (error) {
        logger.error(`Pexels fetch failed for ${menuItem.name}:`, error)
        throw error
      }
    }

    if (fallbackPhoto) {
      usedPhotoIds.add(fallbackPhoto.id)
      return {
        menuItemId: menuItem.id,
        imageUrl: buildMenuImageUrl(fallbackPhoto.id),
        photoId: fallbackPhoto.id,
        duplicate: true,
      }
    }

    return null
  }

  function resolveScopeItems(scope: string, customIds: Array<string | number> = []): MenuItem[] {
    const itemsById = new Map<string | number, MenuItem>()
    const addItems = (items: MenuItem[]): void =>
      (items || []).forEach(item => {
        if (item && !itemsById.has(item.id)) {
          itemsById.set(item.id, item)
        }
      })

    switch (scope) {
      case 'selected':
        addItems(
          allMenuItems.filter(item =>
            (customIds.length ? customIds : selectedItemIds).includes(item.id)
          )
        )
        break
      case 'filtered':
        addItems(selectionPool)
        break
      case 'all':
        addItems(allMenuItems)
        break
      case 'missing':
      default:
        addItems(selectionPool.filter(item => !item.image_url))
        break
    }

    return Array.from(itemsById.values())
  }

  async function handleAutoGenerateImages(
    options: { scope?: string; itemIds?: Array<string | number> } = {}
  ): Promise<void> {
    if (!menuItems || menuItems.length === 0) {
      toast.error('No menu items to generate images for')
      return
    }

    try {
      const scope = options.scope || generationScope
      const customIds = options.itemIds || selectedItemIds
      const initialTargets = resolveScopeItems(scope, customIds)
      const targetItems = overwriteExisting
        ? initialTargets
        : initialTargets.filter(item => !item.image_url)

      if (!targetItems.length) {
        toast.error('No menu items match the selected scope')
        return
      }

      setGenerating(true)
      setCancelGeneration(false)
      setPauseGeneration(false)
      setIsPaused(false)
      setBatchMessage('')
      setGenerationStatus(prev => {
        const next = { ...prev }
        targetItems.forEach(item => {
          next[String(item.id)] = 'queued'
        })
        return next
      })
      setGenerationSummary({ success: 0, fail: 0, fallback: 0 })

      logger.log(
        `Auto generation scope: ${scope}. Target items: ${targetItems.length}. Overwrite existing: ${overwriteExisting}`
      )

      const summary: GenerationSummary = { success: 0, fail: 0, fallback: 0 }
      const totalBatches = Math.ceil(targetItems.length / BATCH_SIZE)
      let allAssignments: Array<{ menuItemId: string | number; imageUrl: string }> = []
      const usedPhotoIds = new Set<string>(existingPhotoIds)

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (cancelRef.current) {
          logger.log('Generation cancelled by user')
          break
        }

        const start = batchIndex * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE, targetItems.length)
        const batch = targetItems.slice(start, end)

        logger.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} items)...`)
        setBatchMessage(
          `Batch ${batchIndex + 1}/${totalBatches}: working on ${batch.length} item${batch.length === 1 ? '' : 's'}`
        )

        for (const menuItem of batch) {
          if (cancelRef.current) {
            break
          }

          if (pauseRef.current) {
            setIsPaused(true)
            while (pauseRef.current && !cancelRef.current) {
              await delay(200)
            }
            setIsPaused(false)
          }

          try {
            logger.log(`Fetching image for: ${menuItem.name}`)
            setGenerationStatus(prev => ({ ...prev, [String(menuItem.id)]: 'fetching' }))

            const assignment = await fetchUniquePhoto(menuItem, usedPhotoIds)

            if (!assignment) {
              logger.warn(`No unique image available for ${menuItem.name}`)
              summary.fail += 1
              setGenerationStatus(prev => ({ ...prev, [String(menuItem.id)]: 'skipped' }))
            } else {
              if (assignment.duplicate) {
                summary.fallback += 1
              }

              allAssignments.push({
                menuItemId: assignment.menuItemId,
                imageUrl: assignment.imageUrl,
              })

              summary.success += 1
              setGenerationStatus(prev => ({
                ...prev,
                [String(menuItem.id)]: assignment.duplicate ? 'duplicate' : 'success',
              }))
            }

            await delay(200)
          } catch (err) {
            logger.error(`Error fetching ${menuItem.name}:`, err)
            summary.fail += 1
            setGenerationStatus(prev => ({ ...prev, [String(menuItem.id)]: 'failed' }))
          }
        }

        if (allAssignments.length > 0) {
          logger.log(`Saving batch ${batchIndex + 1} (${allAssignments.length} images)...`)
          await onBulkAssign(allAssignments)
          allAssignments = []
        }

        if (batchIndex < totalBatches - 1) {
          logger.log('Waiting 2 seconds before next batch...')
          await delay(2000)
        }
      }

      setBatchMessage('')
      setGenerationSummary(summary)

      if (cancelRef.current) {
        toast.error(`Generation cancelled. ${summary.success} images saved.`)
      } else if (summary.success > 0) {
        const parts = [`Generated ${summary.success} images`]
        if (summary.fallback > 0) parts.push(`${summary.fallback} reused`)
        if (summary.fail > 0) parts.push(`${summary.fail} failed/skipped`)
        toast.success(`✅ ${parts.join(' / ')}`)
      } else {
        logger.error('No images generated. All requests failed.')
        toast.error('Failed to generate images. Check console for errors.')
      }
    } catch (error) {
      logger.error('Auto-generation error:', error)
      const err = error as Error
      toast.error(err.message || 'Failed to generate images')
    } finally {
      setGenerating(false)
      setPauseGeneration(false)
      setIsPaused(false)
      setCancelGeneration(false)
    }
  }

  async function handleBulkUpload(): Promise<void> {
    if (selectedFiles.length === 0) {
      toast.error('Please select images first')
      return
    }

    try {
      setUploading(true)
      toast.loading('Compressing and uploading images...')

      const results: UploadResult[] = []

      for (const file of selectedFiles) {
        const compressedFile = await compressImage(file)
        const uploadResults = await uploadMultipleImages([compressedFile])
        if (uploadResults[0]) {
          const result = uploadResults[0]
          results.push({
            fileName: result.fileName || file.name,
            url: result.url || '',
            success: result.success || false,
            duplicate: result.duplicate || false,
            error: result.error || undefined,
          } as UploadResult)
        }
      }

      toast.dismiss()

      const successful = results.filter(result => result.success && !result.duplicate)
      const duplicates = results.filter(result => result.success && result.duplicate)
      const failed = results.filter(result => !result.success)

      if (successful.length > 0) {
        toast.success(
          `${successful.length} image${successful.length === 1 ? '' : 's'} uploaded successfully${
            duplicates.length > 0
              ? ` • ${duplicates.length} duplicate${duplicates.length === 1 ? '' : 's'} reused`
              : ''
          }`
        )
      } else if (duplicates.length > 0 && failed.length === 0) {
        toast.success(
          `${duplicates.length} duplicate image${duplicates.length === 1 ? '' : 's'} reused from library`
        )
      }

      if (failed.length > 0) {
        toast.error(`${failed.length} image${failed.length === 1 ? '' : 's'} failed to upload`)
      }

      setUploadedImages(results.filter(result => result.success))

      const matchResult = await autoMatchImages(
        results as Array<{ fileName: string; [key: string]: unknown }>,
        menuItems
      )
      const autoMatches = matchResult.matches
      const unmatchedImages = matchResult.unmatched
      setMatches(autoMatches as Match[])
      setUnmatched(unmatchedImages as UploadResult[])
    } catch (error) {
      logger.error('Bulk upload error:', error)
      toast.dismiss()
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  function handleManualAssignment(fileIndex: number, menuItemId: string | number): void {
    setManualAssignments(prev => ({
      ...prev,
      [fileIndex]: menuItemId,
    }))
  }

  async function handleApplyAssignments(): Promise<void> {
    const assignments: Array<{ menuItemId: string | number; imageUrl: string }> = []

    matches.forEach(match => {
      assignments.push({
        menuItemId: match.menuItem.id,
        imageUrl: match.file.url,
      })
    })

    Object.entries(manualAssignments).forEach(([fileIndex, menuItemId]) => {
      const file = unmatched[parseInt(fileIndex)]
      if (file && menuItemId) {
        assignments.push({
          menuItemId,
          imageUrl: file.url,
        })
      }
    })

    if (assignments.length === 0) {
      toast.error('No assignments to apply')
      return
    }

    await onBulkAssign(assignments)
    handleClose()
  }

  async function handleSearchPexels(page = 1): Promise<void> {
    if (!pexelsQuery.trim()) {
      toast.error('Enter a search term first')
      return
    }

    try {
      setPexelsLoading(true)
      const { photos, totalResults, nextPage } = await searchFoodPhotos(pexelsQuery, {
        perPage: 12,
        page,
      })
      setPexelsResults(photos as Photo[])
      setPexelsPage(page)
      setPexelsTotal(totalResults)
      setPexelsHasMore(!!nextPage)
    } catch (error) {
      logger.error('Pexels search error:', error)
      const err = error as Error
      toast.error(err.message || 'Failed to search photos')
    } finally {
      setPexelsLoading(false)
    }
  }

  async function handleAssignFromSearch(photo: Photo): Promise<void> {
    const targetIds = selectedItemIds.length
      ? selectedItemIds
      : searchTargetId
        ? [searchTargetId]
        : []

    if (!targetIds.length) {
      toast.error('Select at least one menu item to assign this image')
      return
    }

    const imageUrl = buildMenuImageUrl(photo.id, { width: 800, height: 600 })

    try {
      await onBulkAssign(
        targetIds.map(id => ({
          menuItemId: id,
          imageUrl,
        }))
      )

      toast.success(
        `Assigned image to ${targetIds.length} item${targetIds.length === 1 ? '' : 's'}`
      )
      setGenerationStatus(prev => {
        const next = { ...prev }
        targetIds.forEach(id => {
          next[String(id)] = 'manual'
        })
        return next
      })
    } catch (error) {
      logger.error('Manual assign error:', error)
      toast.error('Failed to assign selected image')
    }
  }

  async function handleDeleteImages(): Promise<void> {
    if (!onBulkDelete) {
      toast.error('Delete handler not configured')
      return
    }

    try {
      setDeleteInProgress(true)
      await onBulkDelete({
        scope: deleteScope,
        itemIds: deleteScope === 'selected' ? (selectedItemIds as string[] | number[]) : [],
      })
    } finally {
      setDeleteInProgress(false)
    }
  }

  function handleClose(): void {
    setSelectedFiles([])
    setUploadedImages([])
    setMatches([])
    setUnmatched([])
    setManualAssignments({})
    setDragActive(false)
    setActiveTab('auto')
    setSelectedItemIds([])
    setGenerationStatus({})
    setGenerationSummary({ success: 0, fail: 0, fallback: 0 })
    setBatchMessage('')
    setPauseGeneration(false)
    setIsPaused(false)
    setDeleteScope('selected')
    setPexelsResults([])
    setPexelsPage(1)
    setPexelsHasMore(false)
    setPexelsQuery('')
    onClose()
  }

  function renderStatusBadge(itemId: string | number): JSX.Element | null {
    const status = generationStatus[String(itemId)]
    if (!status) return null

    const styles: Record<string, string> = {
      queued: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      fetching: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      success: 'bg-green-500/10 text-green-400 border-green-500/30',
      duplicate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      manual: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      skipped: 'bg-gray-500/10 text-[var(--text-muted)] border-gray-500/30',
      failed: 'bg-red-500/10 text-red-400 border-red-500/30',
    }

    const labels: Record<string, string> = {
      queued: 'Queued',
      fetching: 'Fetching',
      success: 'Success',
      duplicate: 'Fallback',
      manual: 'Manual',
      skipped: 'Skipped',
      failed: 'Failed',
    }

    const style = styles[status] || 'bg-gray-500/10 text-[var(--text-muted)] border-gray-500/30'
    return (
      <span className={`text-[10px] border px-2 py-1 rounded-lg ${style}`}>
        {labels[status] || status}
      </span>
    )
  }

  const missingCount = useMemo(
    () => allMenuItems.filter(item => !item.image_url).length,
    [allMenuItems]
  )

  const scopeCounts: ScopeCounts = useMemo(
    () => ({
      selected: selectedItemIds.length,
      filtered: selectionPool.length,
      all: allMenuItems.length,
      missing: missingCount,
    }),
    [selectedItemIds.length, selectionPool, allMenuItems, missingCount]
  )

  const canStartGeneration = !generating && scopeCounts[generationScope as keyof ScopeCounts] > 0

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        data-overlay-scroll
        className="border border-theme rounded-xl p-6 w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col gap-6"
        style={{
          backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(5, 5, 9, 0.95)',
          boxShadow: isLightTheme
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-main">Bulk Image Assignment</h2>
            <p className="text-sm text-text-muted mt-1">
              Upload, search, delete, and auto-generate dish images without leaving the admin.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted text-3xl leading-none transition-colors"
            style={{
              borderRadius: '0.5rem',
              padding: '0.25rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-main)'
              e.currentTarget.style.backgroundColor = isLightTheme
                ? 'rgba(0, 0, 0, 0.08)'
                : 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = ''
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 overflow-hidden">
          <aside className="bg-dark-bg-secondary/50 border border-theme-subtle rounded-lg p-4 flex flex-col gap-4 overflow-hidden">
            <div>
              <h3 className="text-lg font-semibold text-text-main mb-2">Item Selection</h3>
              <p className="text-xs text-text-muted mb-3">
                {selectionCount} selected · {selectionPool.length} in view · {allMenuItems.length}{' '}
                total
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => applySelectionPreset('filtered')}
                  className="btn-outline text-xs px-3 py-1"
                >
                  Select Filtered
                </button>
                <button
                  onClick={() => applySelectionPreset('all')}
                  className="btn-outline text-xs px-3 py-1"
                >
                  Select All
                </button>
                <button
                  onClick={() => applySelectionPreset('none')}
                  className="btn-outline text-xs px-3 py-1"
                >
                  Clear
                </button>
              </div>
              <div
                data-overlay-scroll
                className="max-h-60 overflow-y-auto border border-theme-subtle rounded-lg"
              >
                <ul className="divide-y divide-white/5 text-sm">
                  {selectionPool.map(item => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="accent-gold"
                      />
                      <div className="flex-1">
                        <p className="text-text-main text-xs font-semibold">{item.name}</p>
                        {(item as unknown as { menu_categories?: { name: string } }).menu_categories
                          ?.name && (
                          <p className="text-[11px] text-text-muted">
                            {
                              (item as unknown as { menu_categories: { name: string } })
                                .menu_categories.name
                            }
                          </p>
                        )}
                      </div>
                      {renderStatusBadge(item.id)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border border-theme-subtle rounded-lg p-3 space-y-3 text-xs text-text-muted">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-main">Quick Actions</span>
                <span>Missing images: {missingCount}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    handleAutoGenerateImages({ scope: 'selected', itemIds: selectedItemIds })
                  }
                  className="btn-primary text-xs px-3 py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={generating || selectedItemIds.length === 0}
                >
                  Regenerate Selected
                </button>
                <button
                  onClick={() => handleAutoGenerateImages({ scope: 'missing' })}
                  className="btn-outline text-xs px-3 py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={generating || missingCount === 0}
                >
                  Fill Missing
                </button>
              </div>
              {selectedItemNames.length > 0 && (
                <div className="text-[11px] text-text-muted/80 leading-snug">
                  <p className="text-text-main font-semibold mb-1">Selection preview:</p>
                  <p className="line-clamp-3">{selectedItemNames.join(', ')}</p>
                </div>
              )}
            </div>

            {generationSummary.success + generationSummary.fail > 0 && (
              <div className="border border-theme-subtle rounded-lg p-3 text-xs text-text-muted space-y-1">
                <p className="text-sm font-semibold text-text-main">Last Run</p>
                <p>✅ Success: {generationSummary.success}</p>
                <p>♻️ Fallbacks: {generationSummary.fallback}</p>
                <p>⚠️ Failed/Skipped: {generationSummary.fail}</p>
              </div>
            )}
          </aside>

          <div className="flex flex-col overflow-hidden border border-theme-subtle rounded-lg">
            <div className="border-b border-theme-subtle px-4 pt-3 flex flex-wrap gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-sm rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-text-main font-semibold'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div data-overlay-scroll className="p-4 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'auto' && (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
                    <h3 className="text-lg font-semibold text-text-main flex items-center gap-2">
                      🪄 Smart Auto Generation
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Automatically pull unique, high-quality food photos from Pexels. Choose your
                      scope, optionally overwrite existing images, and monitor per-item progress
                      with pause/resume controls.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-theme-subtle rounded-lg p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-text-main">Generation Scope</h4>
                      <div className="space-y-2">
                        {GENERATION_SCOPES.map(scope => (
                          <label
                            key={scope.id}
                            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="generationScope"
                              value={scope.id}
                              checked={generationScope === scope.id}
                              onChange={() => setGenerationScope(scope.id)}
                              className="accent-gold"
                            />
                            <span>{scope.label}</span>
                          </label>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={overwriteExisting}
                          onChange={e => setOverwriteExisting(e.target.checked)}
                          className="accent-gold"
                        />
                        Overwrite existing images in scope
                      </label>
                    </div>

                    <div className="border border-theme-subtle rounded-lg p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-text-main">Controls</h4>
                      <div className="flex flex-wrap gap-2">
                        {!generating && (
                          <button
                            onClick={() => handleAutoGenerateImages()}
                            disabled={!canStartGeneration}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            Start Generation
                          </button>
                        )}
                        {generating && !pauseGeneration && (
                          <button
                            onClick={() => setPauseGeneration(true)}
                            className="btn-outline flex items-center gap-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 9v6m4-6v6"
                              />
                            </svg>
                            Pause
                          </button>
                        )}
                        {generating && pauseGeneration && (
                          <button
                            onClick={() => setPauseGeneration(false)}
                            className="btn-outline flex items-center gap-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 5l7 7-7 7M3 5l7 7-7 7"
                              />
                            </svg>
                            Resume
                          </button>
                        )}
                        {generating && (
                          <button
                            onClick={() => {
                              setCancelGeneration(true)
                              setPauseGeneration(false)
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-black font-semibold rounded-lg transition-all"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Cancel
                          </button>
                        )}
                      </div>
                      {(generating || batchMessage || isPaused) && (
                        <div className="bg-white/5 border border-theme rounded-lg p-3 text-xs text-text-muted space-y-2">
                          {batchMessage && <p>{batchMessage}</p>}
                          {isPaused && (
                            <p className="text-yellow-400">Paused — press Resume to continue</p>
                          )}
                          <p>
                            Progress:{' '}
                            {
                              Object.values(generationStatus).filter(status =>
                                ['success', 'duplicate', 'manual'].includes(status)
                              ).length
                            }{' '}
                            done / {Object.keys(generationStatus).length} queued
                          </p>
                        </div>
                      )}
                      {!generating && !canStartGeneration && (
                        <p className="text-[11px] text-yellow-400">
                          Select items or choose a scope that has dishes before starting generation.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'search' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                    <div className="flex-1">
                      <label className="text-xs uppercase text-text-muted block mb-1">
                        Search Pexels
                      </label>
                      <input
                        value={pexelsQuery}
                        onChange={e => setPexelsQuery(e.target.value)}
                        placeholder="e.g. chicken biryani food"
                        className="w-full px-3 py-2 bg-dark-bg-secondary border border-theme rounded-lg text-text-main text-sm focus:outline-none focus:border-gold"
                      />
                    </div>
                    <button
                      onClick={() => handleSearchPexels(1)}
                      className="btn-primary px-4 py-2 text-sm"
                      disabled={pexelsLoading}
                    >
                      {pexelsLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  <div className="bg-white/5 border border-theme rounded-lg p-3 text-xs text-text-muted space-y-2">
                    <p>Results: {pexelsTotal}</p>
                    <p>
                      Assign target:{' '}
                      <CustomDropdown
                        options={[
                          { value: '', label: 'Select item...' },
                          ...selectionPool.map(item => ({
                            value: String(item.id),
                            label: item.name,
                          })),
                        ]}
                        value={String(searchTargetId)}
                        onChange={e => setSearchTargetId(e.target.value)}
                        placeholder="Select item..."
                        maxVisibleItems={5}
                      />
                      <span className="ml-2 text-text-muted">
                        (If you have items selected, those will be used first.)
                      </span>
                    </p>
                  </div>

                  {pexelsLoading && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Loading photos...
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pexelsResults.map(photo => (
                      <div
                        key={photo.id}
                        className="group border border-theme rounded-lg overflow-hidden bg-white/5 flex flex-col"
                      >
                        <div className="relative">
                          <img
                            src={photo.previewUrl}
                            alt={photo.photographer || 'Pexels photo'}
                            className="w-full h-40 object-cover transition-transform duration-150 group-hover:scale-105"
                          />
                          <button
                            onClick={() => handleAssignFromSearch(photo)}
                            className="absolute bottom-2 right-2 bg-gold text-dark-bg text-xs font-semibold px-3 py-1 rounded-full shadow-lg hover:shadow-xl transition"
                          >
                            Assign
                          </button>
                        </div>
                        <div className="p-3 text-xs text-text-muted space-y-1 flex-1 flex flex-col">
                          <p className="font-semibold text-text-main text-sm line-clamp-1">
                            Photo #{photo.id}
                          </p>
                          {photo.photographer && (
                            <p className="line-clamp-1">by {photo.photographer}</p>
                          )}
                          <div className="mt-auto text-[10px] text-text-muted/80">
                            <p>Pexels license · Free to use</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pexelsResults.length === 0 && !pexelsLoading && (
                    <p className="text-sm text-text-muted">
                      Search results will appear here. Try cuisine or ingredient keywords (e.g.
                      &quot;thai curry dish&quot;).
                    </p>
                  )}

                  {pexelsResults.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => handleSearchPexels(Math.max(1, pexelsPage - 1))}
                        disabled={pexelsPage <= 1 || pexelsLoading}
                        className="btn-outline text-xs px-3 py-2"
                      >
                        Previous
                      </button>
                      <p className="text-xs text-text-muted">Page {pexelsPage}</p>
                      <button
                        onClick={() => handleSearchPexels(pexelsPage + 1)}
                        disabled={!pexelsHasMore || pexelsLoading}
                        className="btn-outline text-xs px-3 py-2"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-6">
                  {uploadedImages.length === 0 && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-text-main">Manual Upload</h3>
                        <p className="text-xs text-text-muted">
                          Upload and auto-match images by filename.
                        </p>
                      </div>

                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                          dragActive
                            ? 'border-gold bg-gold bg-opacity-10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        {selectedFiles.length > 0 ? (
                          <div>
                            <div className="text-5xl mb-4">📁</div>
                            <p className="text-text-main font-semibold mb-2">
                              {selectedFiles.length} file(s) selected
                            </p>
                            <div data-overlay-scroll className="max-h-40 overflow-y-auto mb-4">
                              <ul className="text-sm text-text-muted space-y-1">
                                {selectedFiles.map((file, index) => (
                                  <li key={index}>{file.name}</li>
                                ))}
                              </ul>
                            </div>
                            <label className="btn-outline cursor-pointer inline-block text-sm px-4 py-2">
                              Choose Different Files
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <div>
                            <div className="text-6xl mb-4">📸</div>
                            <p className="text-text-main font-semibold mb-2">
                              Drag & drop multiple images here
                            </p>
                            <p className="text-sm text-text-muted mb-4">or</p>
                            <label className="btn-outline cursor-pointer inline-block text-sm px-4 py-2">
                              Browse Files
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                            </label>
                            <p className="text-xs text-text-muted mt-4">
                              Select multiple images at once (JPG, PNG, WEBP, GIF)
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedFiles.length > 0 && (
                        <button
                          onClick={handleBulkUpload}
                          disabled={uploading}
                          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              Uploading {selectedFiles.length} images...
                            </span>
                          ) : (
                            `Upload ${selectedFiles.length} Image${selectedFiles.length > 1 ? 's' : ''}`
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {uploadedImages.length > 0 && (
                    <div className="space-y-6">
                      <div className="text-sm text-text-muted space-y-1">
                        <p className="text-text-main font-semibold text-lg">Review & Assign</p>
                        <p>
                          {matches.length} auto-matched · {unmatched.length} need attention
                        </p>
                      </div>

                      {matches.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-green-400">
                            ✓ Auto-Matched ({matches.length})
                          </h4>
                          <div className="space-y-2">
                            {matches.map((match, index) => (
                              <div
                                key={index}
                                className="bg-green-900/20 border border-green-700 rounded-lg p-3 flex items-center gap-3"
                              >
                                <img
                                  src={match.file.url}
                                  alt={match.menuItem.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-xs text-text-muted">{match.file.fileName}</p>
                                  <p className="text-sm text-text-main font-semibold">
                                    → {match.menuItem.name}
                                  </p>
                                </div>
                                <span className="text-[10px] text-green-400 font-semibold">
                                  AUTO
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {unmatched.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-yellow-400">
                            ⚠ Manual Assignment Required ({unmatched.length})
                          </h4>
                          <div className="space-y-3">
                            {unmatched.map((file, index) => (
                              <div
                                key={index}
                                className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 space-y-3"
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={file.url}
                                    alt={file.fileName}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                  <p className="text-sm text-text-muted">{file.fileName}</p>
                                </div>
                                <CustomDropdown
                                  options={[
                                    { value: '', label: 'Select a menu item...' },
                                    ...menuItems.map(item => ({
                                      value: String(item.id),
                                      label: item.name,
                                    })),
                                  ]}
                                  value={String(manualAssignments[index] || '')}
                                  onChange={e => handleManualAssignment(index, e.target.value)}
                                  placeholder="Select a menu item..."
                                  maxVisibleItems={5}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 border-t border-gray-800 pt-4">
                        <button onClick={handleApplyAssignments} className="btn-primary flex-1">
                          Apply {matches.length + Object.keys(manualAssignments).length}{' '}
                          Assignment(s)
                        </button>
                        <button onClick={handleClose} className="btn-outline flex-1">
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-gold bg-opacity-10 border border-gold border-opacity-30 rounded-lg text-xs text-text-muted space-y-2">
                    <p className="text-gold font-semibold">💡 Auto-Matching Tips</p>
                    <ul className="space-y-1">
                      <li>
                        • Name files similar to dish names (e.g., &quot;chicken-tikka.jpg&quot;)
                      </li>
                      <li>• We auto-match when names align; otherwise assign manually.</li>
                      <li>• You can mix manual upload with auto-generation for fine control.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'bulk' && (
                <div className="space-y-6">
                  <div className="border border-theme-subtle rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-semibold text-text-main">Delete Images</h4>
                    <p className="text-xs text-text-muted">
                      Remove images in bulk based on your selection scope. This clears the stored
                      URLs so you can regenerate fresh ones immediately.
                    </p>
                    <div className="space-y-2 text-sm text-text-muted">
                      {DELETE_SCOPES.map(scope => (
                        <label
                          key={scope.id}
                          className="flex items-center gap-2 hover:text-text-main cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="deleteScope"
                            value={scope.id}
                            checked={deleteScope === scope.id}
                            onChange={() => setDeleteScope(scope.id)}
                            className="accent-gold"
                          />
                          <span>
                            {scope.label} ({scopeCounts[scope.id as keyof ScopeCounts]} items)
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={handleDeleteImages}
                      className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-black text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        deleteInProgress ||
                        (deleteScope === 'selected' && selectedItemIds.length === 0)
                      }
                    >
                      {deleteInProgress ? 'Deleting...' : 'Delete Images'}
                    </button>
                    <p className="text-[11px] text-text-muted/70">
                      Tip: Clear images first, then use Auto Generate to refill with brand-new
                      photos.
                    </p>
                  </div>

                  <div className="border border-theme-subtle rounded-lg p-4 space-y-3 text-xs text-text-muted">
                    <h4 className="text-sm font-semibold text-text-main">Regeneration Shortcuts</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAutoGenerateImages({ scope: 'filtered' })}
                        className="btn-outline text-xs px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={generating || selectionPool.length === 0}
                      >
                        Regenerate Filtered
                      </button>
                      <button
                        onClick={() =>
                          handleAutoGenerateImages({
                            scope: 'all',
                            itemIds: allMenuItems.map(item => item.id),
                          })
                        }
                        className="btn-outline text-xs px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={generating || allMenuItems.length === 0}
                      >
                        Regenerate Entire Menu
                      </button>
                      <button
                        onClick={() =>
                          handleAutoGenerateImages({ scope: 'selected', itemIds: selectedItemIds })
                        }
                        className="btn-outline text-xs px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={generating || selectedItemIds.length === 0}
                      >
                        Regenerate Selected
                      </button>
                    </div>
                    <p>
                      Remember to toggle &quot;Overwrite existing images&quot; if you want to
                      replace current photos in your chosen scope.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
