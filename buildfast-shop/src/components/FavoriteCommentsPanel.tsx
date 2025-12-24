import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createReview, uploadReviewImage, fetchUserFavoriteReviews } from '../lib/reviewsApi'
import CustomDropdown from './ui/CustomDropdown'
import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

const FAVORITE_COMMENT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
const FAVORITE_COMMENT_MAX_IMAGES = 3
const FAVORITE_COMMENT_MAX_LENGTH = 300
const FAVORITE_COMMENT_MAX_SIZE = 5 * 1024 * 1024

interface FavoriteItem {
  id: string
  menu_items?: { id: string; name: string; image_url?: string } | null
  dishes?: { id: string; name: string; image_url?: string } | null
  menu_item_id?: string
  product_id?: string
}

interface Comment {
  id: string
  created_at: string
  review_text: string
  review_images?: string[]
  menu_items?: { name: string; image_url?: string } | null
  favorite_target_label?: string
}

interface FavoriteCommentsPanelProps {
  favoriteItems?: FavoriteItem[]
  userId?: string
}

interface Attachment {
  file: File
  url: string
  name: string
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getDaysSince(dateString: string | null | undefined): number | null {
  if (!dateString) return null
  const now = new Date()
  const then = new Date(dateString)
  const diff = Math.ceil((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
  return diff < 0 ? 0 : diff
}

function FavoriteCommentsPanel({ favoriteItems = [], userId }: FavoriteCommentsPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [commentText, setCommentText] = useState<string>('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [listLoading, setListLoading] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [formError, setFormError] = useState<string>('')
  const [feedback, setFeedback] = useState<string>('')
  const [comments, setComments] = useState<Comment[]>([])
  const [lastCommentAt, setLastCommentAt] = useState<string | null>(null)
  const [reminderDismissed, setReminderDismissed] = useState<boolean>(false)

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
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

  const favoriteOptions = useMemo(() => {
    const itemOptions = favoriteItems
      .map(item => {
        const isMenuItem = Boolean(item.menu_items)
        const product = isMenuItem ? item.menu_items : item.dishes
        const targetId = isMenuItem
          ? item.menu_item_id || item.menu_items?.id
          : item.product_id || item.dishes?.id

        if (!product || !targetId) return null

        return {
          value: `${isMenuItem ? 'menu' : 'product'}:${targetId}`,
          label: product.name,
          descriptor: {
            isMenuItem,
            targetId,
            product,
            isGeneral: false,
          },
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return [
      {
        value: 'general',
        label: 'General Feedback',
        descriptor: { isGeneral: true, isMenuItem: false, targetId: null, product: null },
      },
      ...itemOptions,
    ]
  }, [favoriteItems])

  const selectedDescriptor = useMemo(() => {
    return favoriteOptions.find(option => option.value === selectedTarget)?.descriptor || null
  }, [favoriteOptions, selectedTarget])

  const monthlyCount = useMemo(() => {
    if (!comments.length) return 0
    const now = new Date()
    return comments.filter(comment => {
      const created = new Date(comment.created_at)
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
    }).length
  }, [comments])

  const requirementMet = monthlyCount >= 1
  const showReminder = !requirementMet && !reminderDismissed && favoriteOptions.length > 0
  const daysSinceLast = getDaysSince(lastCommentAt)

  useEffect(() => {
    if (!selectedTarget && favoriteOptions.length > 0 && favoriteOptions[0]) {
      setSelectedTarget(favoriteOptions[0].value)
    }
  }, [favoriteOptions, selectedTarget])

  const loadComments = useCallback(async () => {
    if (!userId) return
    setListLoading(true)
    const result = await fetchUserFavoriteReviews({ userId })
    if (result.success && Array.isArray(result.data)) {
      setComments(result.data as Comment[])
      setLastCommentAt((result.data[0] as { created_at?: string | null })?.created_at || null)
    } else {
      setComments([])
      setLastCommentAt(null)
    }
    setListLoading(false)
  }, [userId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`favorite-reviews-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_reviews',
          filter: `user_id=eq.${userId} AND source=eq.favorite`,
        },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, loadComments])

  useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        URL.revokeObjectURL(attachment.url)
      })
    }
  }, [attachments])

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    const next: Attachment[] = []
    const remainingSlots = FAVORITE_COMMENT_MAX_IMAGES - attachments.length

    Array.from(files).forEach(file => {
      if (next.length >= remainingSlots) return
      if (!FAVORITE_COMMENT_ALLOWED_TYPES.includes(file.type)) return
      if (file.size > FAVORITE_COMMENT_MAX_SIZE) return

      next.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      })
    })

    if (!next.length) {
      setFormError('Use JPEG/PNG images under 5MB.')
      return
    }

    setAttachments(prev => [...prev, ...next])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const copy = [...prev]
      const [removed] = copy.splice(index, 1)
      if (removed) {
        URL.revokeObjectURL(removed.url)
      }
      return copy
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedDescriptor) {
      setFormError('Select a feedback category.')
      return
    }

    const trimmed = commentText.trim()
    if (trimmed.length === 0) {
      setFormError("Comment can't be empty.")
      return
    }
    if (trimmed.length > FAVORITE_COMMENT_MAX_LENGTH) {
      setFormError(`Comment must stay within ${FAVORITE_COMMENT_MAX_LENGTH} characters.`)
      return
    }

    if (!userId) {
      setFormError('User ID is required.')
      return
    }

    setFormError('')
    setFeedback('')
    setSubmitting(true)

    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      const imageUploads: string[] = []
      for (const attachment of attachments) {
        const uploadResult = await uploadReviewImage(attachment.file, userId)
        if (!uploadResult.success || !uploadResult.url) {
          const errorMsg =
            typeof uploadResult.error === 'string'
              ? uploadResult.error
              : uploadResult.error?.message || 'Image upload failed'
          throw new Error(errorMsg)
        }
        imageUploads.push(uploadResult.url)
      }

      const favoriteTargetLabel = selectedDescriptor.isGeneral
        ? 'General Feedback'
        : selectedDescriptor.product?.name || 'Favorite Dish'

      const menuItemId = selectedDescriptor.isGeneral
        ? undefined
        : selectedDescriptor.isMenuItem
          ? selectedDescriptor.targetId
          : undefined

      if (!userId) {
        throw new Error('User ID is required')
      }

      const result = await createReview({
        userId,
        productId: undefined,
        menuItemId: menuItemId || undefined,
        itemType: selectedDescriptor.isMenuItem ? 'menu_item' : 'product',
        orderId: undefined,
        orderItemId: undefined,
        rating: undefined,
        reviewText: trimmed,
        reviewImages: imageUploads,
        source: 'favorite',
        favoriteIsGeneral: selectedDescriptor.isGeneral,
        favoriteTargetLabel: favoriteTargetLabel || undefined,
      })

      if (!result?.success) {
        const errorMsg =
          typeof result.error === 'string'
            ? result.error
            : result.error instanceof Error
              ? result.error.message
              : ((result as { message?: string }).message ?? 'Failed to save comment.')
        throw new Error(errorMsg)
      }

      setCommentText('')
      setAttachments(prev => {
        prev.forEach(item => URL.revokeObjectURL(item.url))
        return []
      })
      setFeedback('Comment posted successfully.')
      setReminderDismissed(false)
      loadComments()
    } catch (error) {
      logger.error(error)
      setFormError((error as Error).message || 'Could not post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      className="glow-surface glow-soft rounded-2xl border border-[var(--border-default)] px-6 py-6 space-y-6"
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
        boxShadow: isLightTheme
          ? '0 30px 70px -55px rgba(197, 157, 95, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
          : '0 30px 70px -55px rgba(197, 157, 95, 0.65)',
        borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
      }}
      data-animate="fade-scale"
      data-animate-active="false"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
            Monthly Feedback
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-main)]">
            Comment on Your Favorites
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Minimum one comment per month. Share why you love a dish and attach up to three images.
          </p>
        </div>
        <div
          className="rounded-xl border border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-secondary)]"
          style={{
            backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
            borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
          }}
        >
          <span className="block text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)]">
            This Month
          </span>
          <span className="mt-1 flex items-center gap-2 font-semibold text-[var(--text-main)]">
            {monthlyCount}/1 comment
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                requirementMet
                  ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
                  : 'bg-orange-500/15 text-orange-200 ring-1 ring-orange-400/30'
              }`}
            >
              {requirementMet ? 'On track' : 'Action needed'}
            </span>
          </span>
          {lastCommentAt && (
            <span className="mt-1 block text-xs text-[var(--text-secondary)]">
              Last comment:{' '}
              {daysSinceLast === 0
                ? 'today'
                : `${daysSinceLast} day${daysSinceLast === 1 ? '' : 's'} ago`}
            </span>
          )}
        </div>
      </header>

      {showReminder && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            Drop at least one comment this month to keep your favorites active.
          </div>
          <button
            type="button"
            onClick={() => setReminderDismissed(true)}
            className="text-xs font-medium text-amber-200 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-[2fr,3fr] md:gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
              Dish / Category
            </span>
            <CustomDropdown
              options={favoriteOptions.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              value={selectedTarget}
              onChange={event => setSelectedTarget(String(event.target.value))}
              placeholder="Select dish/category"
              maxVisibleItems={5}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
              Comment{' '}
              <span className="text-[var(--text-secondary)] lowercase">(1–300 characters)</span>
            </span>
            <div className="relative">
              <textarea
                value={commentText}
                onChange={event =>
                  setCommentText(event.target.value.slice(0, FAVORITE_COMMENT_MAX_LENGTH))
                }
                maxLength={FAVORITE_COMMENT_MAX_LENGTH}
                rows={4}
                placeholder="Tell the chef what makes this dish special…"
                className="w-full rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60"
                style={{
                  backgroundColor: isLightTheme
                    ? 'rgba(0, 0, 0, 0.02)'
                    : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
                }}
              />
              <span className="absolute bottom-2 right-3 text-xs text-[var(--text-secondary)]">
                {commentText.length}/{FAVORITE_COMMENT_MAX_LENGTH}
              </span>
            </div>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
            Attach Images{' '}
            <span className="text-[var(--text-secondary)] lowercase">(optional, up to 3)</span>
          </span>
          <div className="flex flex-wrap gap-3">
            <label
              className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              style={{
                backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
                borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined,
              }}
            >
              <input
                type="file"
                accept={FAVORITE_COMMENT_ALLOWED_TYPES.join(',')}
                multiple
                className="hidden"
                onChange={event => {
                  handleFiles(event.target.files)
                  event.target.value = ''
                }}
                disabled={attachments.length >= FAVORITE_COMMENT_MAX_IMAGES || submitting}
              />
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add
            </label>

            {attachments.map((attachment, index) => (
              <div
                key={attachment.url}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border-default)]"
                style={{
                  backgroundColor: isLightTheme
                    ? 'rgba(0, 0, 0, 0.02)'
                    : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
                }}
              >
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs transition"
                  style={{
                    backgroundColor: isLightTheme
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(5, 5, 9, 0.7)',
                    color: 'var(--text-main)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = isLightTheme
                      ? 'rgba(255, 255, 255, 0.95)'
                      : 'rgba(5, 5, 9, 0.95)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = isLightTheme
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(5, 5, 9, 0.7)'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Accepted: JPEG, PNG • Max size: 5MB each.
          </p>
        </div>

        {formError && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {formError}
          </div>
        )}
        {feedback && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            {feedback}
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting || !favoriteOptions.length}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && (
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></span>
            )}
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-secondary)]">
            Recent Comments
          </h3>
          {listLoading && <span className="text-xs text-[var(--text-secondary)]">Refreshing…</span>}
        </div>

        {!comments.length && !listLoading ? (
          <div
            className="rounded-xl border border-[var(--border-default)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]"
            style={{
              backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)',
              borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
            }}
          >
            No comments yet. Share your thoughts to keep your favorites fresh.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {comments.slice(0, 8).map(comment => {
              const product = comment.menu_items
              const image = comment.menu_items?.image_url
              const title = comment.favorite_target_label || product?.name || 'General Feedback'
              return (
                <article
                  key={comment.id}
                  className="glow-surface glow-soft flex flex-col gap-3 rounded-2xl border border-[var(--border-default)] px-4 py-4 backdrop-blur-sm"
                  style={{
                    backgroundColor: isLightTheme
                      ? 'rgba(0, 0, 0, 0.02)'
                      : 'rgba(255, 255, 255, 0.02)',
                    borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined,
                  }}
                >
                  <header className="flex items-start gap-3">
                    {image && (
                      <img
                        src={image}
                        alt={title}
                        className="h-12 w-12 rounded-lg border border-[var(--border-default)] object-cover"
                      />
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-main)]">{title}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {formatDateTime(comment.created_at)}
                      </p>
                    </div>
                  </header>
                  <p className="text-sm text-[var(--text-main)]">{comment.review_text}</p>
                  {comment.review_images && comment.review_images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {comment.review_images.map((url, index) => (
                        <button
                          key={url}
                          type="button"
                          className="group relative h-16 w-16 overflow-hidden rounded-xl border border-[var(--border-default)]"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <img
                            src={url}
                            alt={`Comment attachment ${index + 1}`}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default FavoriteCommentsPanel
