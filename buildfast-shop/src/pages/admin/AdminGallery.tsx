import { useState, useEffect, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../../lib/supabase'
import type { Updates as _Updates } from '../../lib/database.types'
import GalleryCard from '../../components/GalleryCard'
import toast from 'react-hot-toast'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import GalleryCardDetailModal from '../../components/admin/GalleryCardDetailModal'
import { m } from 'framer-motion'
import { pageFade } from '../../components/animations/menuAnimations'
import { EFFECT_OPTIONS, parseEffects, parseEffectVariants } from '../../utils/effects'
import { logger } from '../../utils/logger'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

interface GalleryCard {
  id: string
  position: number
  default_image_url: string
  hover_image_url?: string
  effect?: string | string[]
  effect_variants?: string | string[]
  updated_at?: string
  created_at?: string
  is_active: boolean
  caption?: string
  description?: string
}

const AdminGallery = () => {
  const containerRef = useViewportAnimationTrigger()
  const [galleryCards, setGalleryCards] = useState<GalleryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [error, setError] = useState('')
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<string | null>(null)

  // Check admin status
  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to access this page')
        setCheckingAdmin(false)
        return
      }

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (customerError) {
        logger.error('Error checking admin status:', customerError)
        setError('Failed to verify admin status')
        setCheckingAdmin(false)
        return
      }

      if (!customer || !customer.is_admin) {
        setError('Access denied. Admin privileges required.')
        setCheckingAdmin(false)
        return
      }

      setIsAdmin(true)
      setCheckingAdmin(false)
    } catch (err) {
      logger.error('Error checking admin status:', err)
      setError('An error occurred while verifying permissions')
      setCheckingAdmin(false)
    }
  }

  // Fetch gallery cards function (defined before useEffect)
  const fetchGalleryCards = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('gallery_cards')
        .select('*')
        .order('position', { ascending: true })

      if (error) throw error

      setGalleryCards(data || [])
    } catch (error) {
      logger.error('Error fetching gallery cards:', error)
      toast.error('Failed to load gallery cards')
    } finally {
      setLoading(false)
    }
  }

  // Check admin on mount
  useEffect(() => {
    checkAdminStatus()
  }, [])

  // Fetch all gallery cards (including inactive) - only if admin
  useEffect(() => {
    if (!isAdmin) return

    fetchGalleryCards()

    // Real-time subscription
    const channel = supabase
      .channel('admin:gallery_cards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_cards',
        },
        () => {
          fetchGalleryCards()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin]) // FIXED: Added isAdmin to dependency array

  // Upload image to Supabase Storage
  const uploadImage = async (
    file: File,
    cardId: string,
    imageType: string
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `card-${cardId}-${imageType}-${Date.now()}.${fileExt}`
      const filePath = `about-gallery/${fileName}`

      // Validate file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload JPG, PNG, or WebP')
        return null
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return null
      }

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('background-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from('background-images').getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      logger.error('Upload error:', error)
      toast.error('Failed to upload image')
      return null
    }
  }

  // Handle image upload
  const handleImageUpload = async (
    cardId: string,
    imageType: 'default' | 'hover',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(prev => ({ ...prev, [`${cardId}-${imageType}`]: true }))

    const imageUrl = await uploadImage(file, cardId, imageType)

    if (imageUrl) {
      // Update card in database
      const updateField = imageType === 'default' ? 'default_image_url' : 'hover_image_url'

      const updateData = { [updateField]: imageUrl, updated_at: new Date().toISOString() } as any
      const { error } = await (supabase
        .from('gallery_cards') as any)
        .update(updateData)
        .eq('id', cardId)

      if (error) {
        toast.error('Failed to update card')
      } else {
        toast.success(`${imageType === 'default' ? 'Default' : 'Hover'} image uploaded`)
      }
    }

    setUploading(prev => ({ ...prev, [`${cardId}-${imageType}`]: false }))
  }

  // Update card effect
  const updateEffect = async (cardId: string, nextVariants: string[][]) => {
    const baseFallback =
      Array.isArray(nextVariants) && nextVariants.length > 0 ? nextVariants[0] : ['crossfade']
    const normalizedVariants = parseEffectVariants(nextVariants, baseFallback)
    const primary = normalizedVariants[0] ?? ['crossfade']
    const payload = {
      effect: primary,
      effect_variants: normalizedVariants,
    }
    const updateData = { ...payload, updated_at: new Date().toISOString() } as any
    const { error } = await (supabase
      .from('gallery_cards') as any)
      .update(updateData)
      .eq('id', cardId)

    if (error) {
      const message = error.message ?? 'Failed to update effect'
      toast.error(message)
      return
    }

    setGalleryCards(previous =>
      previous.map(card =>
        card.id === cardId
          ? {
              ...card,
              effect: payload.effect,
              effect_variants: payload.effect_variants,
              updated_at: new Date().toISOString(),
            }
          : card
      )
    )
    toast.success('Animation sequence updated')
  }

  // Toggle active status
  const toggleActive = async (cardId: string, currentStatus: boolean) => {
    const updateData = { is_active: !currentStatus, updated_at: new Date().toISOString() } as any
    const { error } = await (supabase
      .from('gallery_cards') as any)
      .update(updateData)
      .eq('id', cardId)

    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success(currentStatus ? 'Card hidden' : 'Card activated')
    }
  }

  // Open delete confirmation
  const openDeleteConfirm = (cardId: string) => {
    setCardToDelete(cardId)
    setShowDeleteConfirm(true)
  }

  // Delete card
  const deleteCard = async () => {
    if (!cardToDelete) return

    const { error } = await supabase.from('gallery_cards').delete().eq('id', cardToDelete)

    if (error) {
      toast.error('Failed to delete card')
    } else {
      toast.success('Card deleted')
      setShowDeleteConfirm(false)
      setCardToDelete(null)
    }
  }

  // Reorder cards
  const moveCard = async (cardId: string, direction: 'up' | 'down') => {
    const card = galleryCards.find(c => c.id === cardId)
    if (!card) return

    const newPosition = direction === 'up' ? card.position - 1 : card.position + 1

    // Find card at target position
    const targetCard = galleryCards.find(c => c.position === newPosition)

    if (!targetCard) return

    // Swap positions
    const updateData1 = { position: newPosition } as any
    const { error: error1 } = await (supabase
      .from('gallery_cards') as any)
      .update(updateData1)
      .eq('id', cardId)

    const updateData2 = { position: card.position } as any
    const { error: error2 } = await (supabase
      .from('gallery_cards') as any)
      .update(updateData2)
      .eq('id', targetCard.id)

    if (error1 || error2) {
      toast.error('Failed to reorder cards')
    } else {
      toast.success('Cards reordered')
    }
  }

  // Add new card
  const addNewCard = async () => {
    const maxPosition = Math.max(...galleryCards.map(c => c.position), 0)

    const { error } = await supabase.from('gallery_cards').insert({
      position: maxPosition + 1,
      default_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      hover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
      effect: 'crossfade',
      is_active: true,
    })

    if (error) {
      toast.error('Failed to add card')
    } else {
      toast.success('New card added')
    }
  }

  const openCardModal = (cardId: string) => {
    setSelectedCardId(cardId)
    setIsCardModalOpen(true)
  }

  const closeCardModal = () => {
    setIsCardModalOpen(false)
    setSelectedCardId(null)
  }

  const selectedCard = useMemo(
    () => galleryCards.find(card => card.id === selectedCardId) || null,
    [galleryCards, selectedCardId]
  )

  const selectedCardIndex = useMemo(() => {
    if (!selectedCard) return -1
    return galleryCards.findIndex(card => card.id === selectedCard.id)
  }, [galleryCards, selectedCard])

  // Show checking admin status
  if (checkingAdmin) {
    return (
      <div
        className="flex justify-center items-center h-full min-h-[400px]"
        style={{ backgroundColor: 'var(--bg-main)' }}
      >
        <div className="text-center space-y-4">
          <div
            className="animate-spin rounded-full h-16 w-16 border-4 mx-auto"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          ></div>
          <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            Verifying admin access...
          </p>
        </div>
      </div>
    )
  }

  // Show error if not admin or other error
  if (error || !isAdmin) {
    return (
      <div
        className="flex justify-center items-center h-full min-h-[400px]"
        style={{ backgroundColor: 'var(--bg-main)' }}
      >
        <div className="max-w-md mx-auto">
          <div
            className="glow-surface glow-strong text-center p-8 rounded-2xl border backdrop-blur-xl"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <svg
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: '#ef4444' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#ef4444' }}>
              Access Denied
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-subtitle)' }}>
              {error || 'Admin privileges required'}
            </p>
            <button
              onClick={() => (window.location.href = '/admin')}
              className="mt-6 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'var(--accent)', color: '#111' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading gallery cards with skeleton
  if (loading) {
    return (
      <m.main
        ref={containerRef}
        className="w-full bg-[var(--bg-main)] text-[var(--text-main)] py-12"
        variants={pageFade}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          pointerEvents: 'auto',
          // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
          paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
          paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
          // Ensure no overflow constraints that break positioning
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible',
        }}
      >
        <div className="mx-auto max-w-[1600px] px-6">
          <header className="mb-12 space-y-6" data-animate="fade-rise" data-animate-active="false">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="h-10 bg-[var(--bg-elevated)] rounded w-64 animate-pulse" />
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-96 animate-pulse" />
              </div>
            </div>
          </header>

          {/* Gallery Grid Skeleton */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            role="status"
            aria-label="Loading gallery cards"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="space-y-4 animate-pulse">
                <div
                  className="aspect-[4/3] bg-[var(--bg-elevated)] rounded-lg"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4" />
                <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </m.main>
    )
  }

  return (
    <m.main
      ref={containerRef}
      className="w-full bg-[var(--bg-main)] text-[var(--text-main)] py-12"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="mx-auto max-w-[1600px] px-6">
        <header className="mb-12 space-y-6" data-animate="fade-rise" data-animate-active="false">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-text-main">
                Gallery Management
              </h1>
              <p className="text-base text-text-muted">
                Manage About page gallery cards and hover effects
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={addNewCard}
                className="px-6 py-3 rounded-xl font-semibold text-[#C59D5F] border border-[#C59D5F]/40 bg-transparent transition-all duration-200 hover:-translate-y-[2px]"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add New Card
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Gallery Cards List */}
        <section
          data-animate="fade-scale"
          data-animate-active="false"
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {galleryCards.map((card, index) => {
            const baseEffects = parseEffects(card.effect)
            const effectSequence = parseEffectVariants(card.effect_variants, baseEffects)
            const captionText =
              card.caption || card.description || `Card #${card.position} • Gallery showcase`
            const sequenceSummary = effectSequence
              .map((round, roundIndex) => {
                const labels = round
                  .map(
                    value => EFFECT_OPTIONS.find(option => option.value === value)?.label ?? value
                  )
                  .join(' + ')
                if (roundIndex > 0) {
                  const currentKey = round.join('|')
                  const previousKey = effectSequence[roundIndex - 1]?.join('|') ?? ''
                  if (currentKey === previousKey) {
                    return `Round ${roundIndex + 1}: Same as previous round (${labels || 'No animations configured'})`
                  }
                }
                return `Round ${roundIndex + 1}: ${labels || 'No animations configured'}`
              })
              .join(' | ')

            return (
              <article
                key={card.id}
                className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-theme bg-[rgba(6,8,12,0.95)] shadow-[0_18px_48px_rgba(0,0,0,0.4)] md:min-h-[380px] xl:min-h-[420px]"
                data-animate="fade-rise"
                data-animate-active="false"
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <div
                  className={`flex h-full flex-col rounded-2xl border border-theme bg-[rgba(6,8,12,0.95)] p-6 md:p-8 ${card.is_active ? '' : 'opacity-70'}`}
                  data-animate="fade-scale"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="flex flex-col gap-4 border-b border-theme pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-text-main">
                        Card #{card.position}
                      </h3>
                      <p className="text-xs text-text-muted uppercase tracking-[0.22em]">
                        Gallery showcase
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${card.is_active ? 'border-emerald-500/40 text-emerald-300' : 'border-rose-500/40 text-rose-300'}`}
                    >
                      <span className="text-[0.65rem]">{card.is_active ? 'Active' : 'Hidden'}</span>
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-6 pt-6">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-theme-strong bg-[rgba(10,12,18,0.92)] shadow-[0_14px_35px_rgba(0,0,0,0.35)]">
                      <GalleryCard
                        defaultImage={card.default_image_url}
                        hoverImage={card.hover_image_url}
                        effect={baseEffects}
                        effectVariants={effectSequence}
                        alt={`Gallery card ${card.position}`}
                        caption={captionText}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-theme bg-[rgba(8,10,14,0.92)] px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <svg
                          className="h-4 w-4 text-[#C59D5F]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                          />
                        </svg>
                        <span className="text-text-muted">
                          Effects:{' '}
                          <span className="font-semibold text-[#C59D5F]">{sequenceSummary}</span>
                        </span>
                      </div>
                      <span className="text-xs text-text-muted uppercase tracking-[0.18em]">
                        Updated{' '}
                        {formatDistanceToNow(new Date(card.updated_at || card.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                      <button
                        onClick={() => toggleActive(card.id, card.is_active)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] transition-all duration-200 hover:-translate-y-[2px] ${card.is_active ? 'border-rose-500/40 text-rose-300' : 'border-emerald-500/40 text-emerald-300'}`}
                      >
                        {card.is_active ? 'Hide Card' : 'Activate Card'}
                      </button>
                      <button
                        onClick={() => openCardModal(card.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-theme-strong px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-text-main transition-all duration-200 hover:-translate-y-[2px]"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

        <GalleryCardDetailModal
          card={selectedCard}
          isOpen={isCardModalOpen}
          onClose={closeCardModal}
          uploading={uploading}
          handleImageUpload={handleImageUpload}
          updateEffect={updateEffect}
          toggleActive={toggleActive}
          moveCard={moveCard}
          deleteCard={openDeleteConfirm}
          index={selectedCardIndex}
          totalCards={galleryCards.length}
        />

        {galleryCards.length === 0 && (
          <div
            className="text-center py-20 rounded-2xl border border-theme bg-[rgba(6,8,12,0.95)] shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-[#C59D5F]/30 text-[#C59D5F]">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-text-main">No Gallery Cards Yet</h3>
                <p className="text-sm text-text-muted">
                  Create your first gallery card with hover effects for the About page
                </p>
              </div>
              <button
                onClick={addNewCard}
                className="px-8 py-4 rounded-xl font-semibold text-[#C59D5F] border border-[#C59D5F]/40 bg-transparent transition-all duration-200 hover:-translate-y-[2px]"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Your First Card
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setCardToDelete(null)
        }}
        onConfirm={deleteCard}
        title="Delete Gallery Card"
        message="Are you sure you want to delete this gallery card?\n\nThis action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </m.main>
  )
}

export default AdminGallery
