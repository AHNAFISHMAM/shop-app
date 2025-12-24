import { useState, useEffect, useCallback, ChangeEvent, FormEvent, KeyboardEvent } from 'react'
import { m } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  getAllDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  getDiscountCodeUsageStats,
  formatDiscountDisplay,
  isDiscountCodeActive,
  type DiscountCode,
} from '../../lib/discountUtils'
import { useViewportAnimationTrigger } from '../../hooks/useViewportAnimationTrigger'
import { pageFade } from '../../components/animations/menuAnimations'
import { logger } from '../../utils/logger'
import CustomDropdown from '../../components/ui/CustomDropdown'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

interface FormData {
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  min_order_amount: string
  max_discount_amount: string
  starts_at: string
  expires_at: string
  usage_limit: string
  one_per_customer: boolean
  is_active: boolean
}

interface UsageStats {
  usage_count: number
  total_revenue: number
  total_discount: number
  usage_history?: Array<{
    order_id?: string
    used_at?: string
    discount_amount?: number
    order_total?: number
  }>
}

/**
 * Admin Discount Codes Page
 *
 * Manage discount codes - create, edit, delete discount codes.
 * Admins can create coupon codes for special deals.
 */
function AdminDiscountCodes(): JSX.Element {
  const containerRef = useViewportAnimationTrigger()
  const { user } = useAuth()

  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    starts_at: '',
    expires_at: '',
    usage_limit: '',
    one_per_customer: true,
    is_active: true,
  })

  // Fetch discount codes
  useEffect(() => {
    fetchCodes()

    // Set up real-time subscription for discount codes
    const channel = supabase
      .channel('discount-codes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discount_codes',
        },
        payload => {
          if (import.meta.env.DEV) {
            logger.log('Discount code change detected:', payload.eventType, payload)
          }

          if (!payload || !payload.eventType) {
            return
          }

          if (payload.eventType === 'INSERT') {
            if (payload.new && payload.new.id) {
              setCodes(prev => {
                const exists = prev.some(c => c.id === payload.new.id)
                if (exists) return prev
                return [payload.new as DiscountCode, ...prev].sort((a, b) => {
                  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                  return dateB - dateA
                })
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new && payload.new.id) {
              setCodes(prev =>
                prev.map(code =>
                  code.id === payload.new.id ? (payload.new as DiscountCode) : code
                )
              )
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old && payload.old.id) {
              setCodes(prev => prev.filter(code => code.id !== payload.old.id))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchCodes = async (): Promise<void> => {
    try {
      setLoading(true)
      const result = await getAllDiscountCodes()

      if (result.success && result.data) {
        setCodes(result.data as DiscountCode[])
      } else {
        const errorMsg =
          result.error instanceof Error
            ? result.error.message
            : String(result.error || 'Unknown error')
        setError('Failed to load discount codes: ' + errorMsg)
      }
    } catch (err) {
      logger.error('Error fetching discount codes:', err)
      setError('Failed to load discount codes')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e:
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      | { target: { value: string | number; name?: string } }
  ): void => {
    let name: string | undefined
    let value: string | number
    let type: string | undefined
    let checked: boolean | undefined

    if ('target' in e && e.target) {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      name = target.name
      value = target.value
      type = target.type
      checked = 'checked' in target ? target.checked : undefined
    } else if ('target' in e) {
      const target = e.target as { value: string | number; name?: string }
      name = target.name
      value = target.value
    } else {
      return
    }
    if (!name) return
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (error) setError('')
    if (success) setSuccess(false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!formData.code.trim()) {
      setError('Discount code is required')
      return
    }

    if (formData.code.trim().length < 2) {
      setError('Discount code must be at least 2 characters')
      return
    }

    if (!formData.discount_type) {
      setError('Discount type is required')
      return
    }

    const discountValue = parseFloat(formData.discount_value)
    if (!formData.discount_value || isNaN(discountValue) || discountValue <= 0) {
      setError('Discount value must be a valid number greater than 0')
      return
    }

    if (formData.discount_type === 'percentage' && discountValue > 100) {
      setError('Percentage discount cannot exceed 100%')
      return
    }

    if (formData.min_order_amount && parseFloat(formData.min_order_amount) < 0) {
      setError('Minimum order amount cannot be negative')
      return
    }

    if (formData.max_discount_amount && parseFloat(formData.max_discount_amount) < 0) {
      setError('Max discount amount cannot be negative')
      return
    }

    if (formData.usage_limit && parseInt(formData.usage_limit) < 1) {
      setError('Usage limit must be at least 1')
      return
    }

    // Date validation
    if (formData.starts_at && formData.expires_at) {
      const startDate = new Date(formData.starts_at)
      const endDate = new Date(formData.expires_at)
      if (startDate >= endDate) {
        setError('Expiration date must be after start date')
        return
      }
    }

    try {
      const codeData = {
        code: formData.code.trim(),
        description: formData.description.trim() || null,
        discount_type: formData.discount_type,
        discount_value: discountValue,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        max_discount_amount: formData.max_discount_amount
          ? parseFloat(formData.max_discount_amount)
          : null,
        starts_at: formData.starts_at || new Date().toISOString(),
        expires_at: formData.expires_at || null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        one_per_customer: formData.one_per_customer,
        is_active: formData.is_active,
        created_by: user?.id,
      }

      let result
      if (editingCode) {
        result = await updateDiscountCode(editingCode.id, codeData)
      } else {
        result = await createDiscountCode(codeData)
      }

      if (result.success) {
        setSuccessMessage(
          editingCode
            ? 'Discount code updated successfully!'
            : 'Discount code created successfully!'
        )
        setSuccess(true)
        closeModal()
        setTimeout(() => {
          setSuccess(false)
          setSuccessMessage('')
        }, 3000)
      } else {
        const error = result.error as { code?: string; message?: string } | undefined
        if (error?.code === '23505') {
          setError('A discount code with this name already exists')
        } else {
          setError(error?.message || 'Failed to save discount code')
        }
      }
    } catch (err) {
      logger.error('Error saving discount code:', err)
      const error = err as Error
      setError('Failed to save discount code: ' + (error.message || 'Unknown error'))
    }
  }

  const handleEdit = (code: DiscountCode): void => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: String(code.discount_value),
      min_order_amount: code.min_order_amount ? String(code.min_order_amount) : '',
      max_discount_amount: code.max_discount_amount ? String(code.max_discount_amount) : '',
      starts_at: code.starts_at ? new Date(code.starts_at).toISOString().slice(0, 16) : '',
      expires_at: code.expires_at ? new Date(code.expires_at).toISOString().slice(0, 16) : '',
      usage_limit: code.usage_limit ? String(code.usage_limit) : '',
      one_per_customer: code.one_per_customer !== false,
      is_active: code.is_active !== false,
    })
    setShowModal(true)
    setError('')
    setSuccess(false)
  }

  const openDeleteConfirm = (codeId: string): void => {
    setCodeToDelete(codeId)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async (): Promise<void> => {
    if (!codeToDelete) return

    try {
      const result = await deleteDiscountCode(codeToDelete)

      if (result.success) {
        setSuccessMessage('Discount code deleted successfully')
        setSuccess(true)
        setShowDeleteConfirm(false)
        setCodeToDelete(null)
        setTimeout(() => {
          setSuccess(false)
          setSuccessMessage('')
        }, 3000)
        fetchCodes()
      } else {
        const errorMsg =
          result.error instanceof Error
            ? result.error.message
            : String(result.error || 'Unknown error')
        setError('Failed to delete discount code: ' + errorMsg)
      }
    } catch (err) {
      logger.error('Error deleting discount code:', err)
      setError('Failed to delete discount code')
    }
  }

  const handleViewUsage = async (codeId: string): Promise<void> => {
    setLoadingStats(true)
    setShowUsageModal(true)
    setError('')

    try {
      const result = await getDiscountCodeUsageStats(codeId)

      if (result.success) {
        setUsageStats(result.data as UsageStats)
      } else {
        setError('Failed to load usage statistics')
        setUsageStats(null)
      }
    } catch (err) {
      logger.error('Error loading usage stats:', err)
      setError('Failed to load usage statistics')
      setUsageStats(null)
    } finally {
      setLoadingStats(false)
    }
  }

  const closeModal = useCallback((): void => {
    setShowModal(false)
    setEditingCode(null)
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      starts_at: '',
      expires_at: '',
      usage_limit: '',
      one_per_customer: true,
      is_active: true,
    })
    setError('')
    setSuccess(false)
  }, [])

  const closeUsageModal = (): void => {
    setShowUsageModal(false)
    setUsageStats(null)
  }

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && (showModal || showUsageModal)) {
        if (showModal) closeModal()
        if (showUsageModal) closeUsageModal()
      }
    }
    document.addEventListener('keydown', handleEscape as unknown as EventListener)
    return () => document.removeEventListener('keydown', handleEscape as unknown as EventListener)
  }, [showModal, showUsageModal, closeModal])

  const baseInputClass =
    'w-full rounded-lg border border-theme bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--text-main)] placeholder:text-muted focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50'
  const checkboxClass =
    'h-4 w-4 rounded border-theme-medium bg-[rgba(255,255,255,0.05)] text-[var(--accent)] focus:ring-[var(--accent)]/40 focus:ring-offset-0 focus:ring-offset-transparent'

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
        <header
          className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          data-animate="fade-rise"
          data-animate-active="false"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Promotion Control</p>
            <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Discount Codes</h1>
            <p className="mt-2 text-sm text-muted">
              Create, activate, and monitor promotional codes to reward loyal guests.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCode(null)
              setFormData({
                code: '',
                description: '',
                discount_type: 'percentage',
                discount_value: '',
                min_order_amount: '',
                max_discount_amount: '',
                starts_at: '',
                expires_at: '',
                usage_limit: '',
                one_per_customer: true,
                is_active: true,
              })
              setError('')
              setSuccess(false)
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-[0_18px_45px_-30px_rgba(197,157,95,0.65)]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Code
          </button>
        </header>

        {success && (
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface glow-soft rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 shadow-[0_25px_60px_-40px_rgba(5,5,9,0.8)]"
          >
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-emerald-100">{successMessage}</p>
            </div>
          </div>
        )}

        {error && !showModal && (
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface glow-soft rounded-2xl border border-rose-500/35 bg-rose-500/10 px-5 py-4 shadow-[0_25px_60px_-40px_rgba(5,5,9,0.8)]"
          >
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-rose-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-rose-100">{error}</p>
            </div>
          </div>
        )}

        <section>
          {loading ? (
            <div className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-12 text-center shadow-[0_35px_80px_-60px_rgba(5,5,9,0.85)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-theme bg-[rgba(255,255,255,0.04)]">
                <span className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)]/70 border-t-transparent"></span>
              </div>
              <p className="mt-4 text-sm text-muted">Loading discount codes…</p>
            </div>
          ) : codes.length === 0 ? (
            <div className="glow-surface glow-soft rounded-2xl border border-theme bg-[rgba(255,255,255,0.02)] p-12 text-center shadow-[0_35px_80px_-60px_rgba(5,5,9,0.85)]">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-theme bg-[rgba(255,255,255,0.04)]">
                <svg
                  className="h-9 w-9 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">No discount codes yet</h3>
              <p className="mt-2 text-sm text-muted">
                Launch your first promo to surprise guests with a special reward.
              </p>
              <button
                onClick={() => {
                  setEditingCode(null)
                  setFormData({
                    code: '',
                    description: '',
                    discount_type: 'percentage',
                    discount_value: '',
                    min_order_amount: '',
                    max_discount_amount: '',
                    starts_at: '',
                    expires_at: '',
                    usage_limit: '',
                    one_per_customer: true,
                    is_active: true,
                  })
                  setError('')
                  setSuccess(false)
                  setShowModal(true)
                }}
                className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-[0_18px_45px_-30px_rgba(197,157,95,0.65)]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Code
              </button>
            </div>
          ) : (
            <div
              data-animate="fade-scale"
              data-animate-active="false"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {codes.map(code => (
                <article
                  key={code.id}
                  className="glow-surface glow-soft flex flex-col gap-4 rounded-2xl border border-theme bg-[rgba(5,5,9,0.92)] p-5 shadow-[0_20px_60px_-45px_rgba(5,5,9,0.85)]"
                  data-animate="fade-rise"
                  data-animate-active="false"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--text-main)]">{code.code}</h3>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        isDiscountCodeActive(code)
                          ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
                          : 'bg-[rgba(255,255,255,0.05)] text-muted ring-1 ring-white/10'
                      }`}
                    >
                      {isDiscountCodeActive(code) ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{code.description || 'No description'}</p>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span>{formatDiscountDisplay(code)}</span>
                    {code.min_order_amount && code.min_order_amount > 0 && (
                      <span>Min: ${parseFloat(String(code.min_order_amount)).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span>{code.usage_count || 0} uses</span>
                    {code.usage_limit && <span>/{code.usage_limit}</span>}
                    {code.one_per_customer && <span>One per customer</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span>
                      Expires:{' '}
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewUsage(code.id as string)}
                      className="rounded-lg border border-theme bg-[rgba(255,255,255,0.04)] p-2 text-muted transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
                      title="View usage statistics"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(code)}
                      className="rounded-lg border border-theme bg-[rgba(255,255,255,0.04)] p-2 text-muted transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
                      title="Edit discount code"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(code.id)}
                      className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-rose-200 transition hover:border-rose-400/50 hover:text-rose-100"
                      title="Delete discount code"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-overlay-scroll
          style={{
            backgroundColor: 'var(--modal-backdrop)',
          }}
          onClick={closeModal}
        >
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface glow-soft w-full max-w-3xl rounded-3xl border border-theme bg-[var(--bg-main)]"
            style={{
              boxShadow: 'var(--modal-shadow)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-theme bg-[rgba(12,12,20,0.96)] px-6 py-5">
              <div>
                <h2 id="modal-title" className="text-xl font-semibold">
                  {' '}
                  {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {editingCode
                    ? 'Fine-tune the details of this prom.'
                    : 'Configure the incentives below.'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg border border-theme bg-theme-elevated p-2 text-muted transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                aria-label="Close modal"
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6">
              {error && (
                <div className="mb-6 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 shadow-[0_25px_60px_-40px_rgba(5,5,9,0.8)]">
                  <p className="text-sm text-rose-200">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10 pointer-events-auto">
                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                  >
                    Code Name <span className="text-rose-300">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    maxLength={50}
                    className={`${baseInputClass} uppercase`}
                    placeholder="SUMMER20"
                    disabled={!!editingCode}
                  />
                  <p className="mt-1 text-xs text-muted">
                    {editingCode
                      ? 'Code name is locked once issued.'
                      : 'Code will be auto-formatted to uppercase.'}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    maxLength={200}
                    className={`${baseInputClass} resize-y`}
                    placeholder="Describe the experience or offer linked to this code."
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="discount_type"
                      className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                    >
                      Discount Type <span className="text-rose-300">*</span>
                    </label>
                    <CustomDropdown
                      id="discount_type"
                      name="discount_type"
                      options={[
                        { value: 'percentage', label: 'Percentage (%)' },
                        { value: 'fixed', label: 'Fixed Amount ($)' },
                      ]}
                      value={formData.discount_type}
                      onChange={handleChange}
                      placeholder="Select discount type"
                      required
                      maxVisibleItems={5}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="discount_value"
                      className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                    >
                      Discount Value <span className="text-rose-300">*</span>
                    </label>
                    <div className="relative">
                      {formData.discount_type === 'percentage' ? (
                        <>
                          <input
                            type="number"
                            id="discount_value"
                            name="discount_value"
                            value={formData.discount_value}
                            onChange={handleChange}
                            required
                            min="0"
                            max="100"
                            step="0.01"
                            className={`${baseInputClass} pr-10`}
                            placeholder="20"
                          />
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                            %
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                            $
                          </span>
                          <input
                            type="number"
                            id="discount_value"
                            name="discount_value"
                            value={formData.discount_value}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            className={`${baseInputClass} pl-10`}
                            placeholder="10.00"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {formData.discount_type === 'percentage' && (
                  <div>
                    <label
                      htmlFor="max_discount_amount"
                      className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                    >
                      Max Discount Amount (Optional)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                        $
                      </span>
                      <input
                        type="number"
                        id="max_discount_amount"
                        name="max_discount_amount"
                        value={formData.max_discount_amount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={`${baseInputClass} pl-10`}
                        placeholder="50.00"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Set an optional ceiling for the discount value on percentage codes.
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="min_order_amount"
                    className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                  >
                    Minimum Order Amount (Optional)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                      $
                    </span>
                    <input
                      type="number"
                      id="min_order_amount"
                      name="min_order_amount"
                      value={formData.min_order_amount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={`${baseInputClass} pl-10`}
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Require a minimum spend before the promotion unlocks.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="starts_at"
                      className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                    >
                      Start Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      id="starts_at"
                      name="starts_at"
                      value={formData.starts_at}
                      onChange={handleChange}
                      className={baseInputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="expires_at"
                      className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                    >
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      id="expires_at"
                      name="expires_at"
                      value={formData.expires_at}
                      onChange={handleChange}
                      className={baseInputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="usage_limit"
                    className="mb-2 block text-sm font-medium text-[var(--text-main)]"
                  >
                    Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    id="usage_limit"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    className={baseInputClass}
                    placeholder="Leave empty for unlimited"
                  />
                  <p className="mt-1 text-xs text-muted">
                    Control how many times this code may be redeemed in total.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="one_per_customer"
                      checked={formData.one_per_customer}
                      onChange={handleChange}
                      className={checkboxClass}
                    />
                    <span className="text-sm text-muted">
                      Limit to one redemption per customer profile.
                    </span>
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className={checkboxClass}
                    />
                    <span className="text-sm text-muted">
                      Keep this promotion active and visible to guests.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-theme pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-theme-strong bg-[rgba(255,255,255,0.03)] px-5 py-2 text-sm font-medium text-muted transition hover:border-[var(--accent)]/40 hover:text-[var(--text-main)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2 px-6 py-2 text-sm font-semibold shadow-[0_18px_45px_-30px_rgba(197,157,95,0.65)]"
                  >
                    {editingCode ? 'Update Code' : 'Create Code'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showUsageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-overlay-scroll
          style={{
            backgroundColor: 'var(--modal-backdrop)',
          }}
          onClick={closeUsageModal}
        >
          <div
            data-animate="fade-scale"
            data-animate-active="false"
            className="glow-surface glow-soft w-full max-w-2xl rounded-3xl border border-theme bg-[var(--bg-main)]"
            style={{
              boxShadow: 'var(--modal-shadow)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-theme bg-[rgba(12,12,20,0.96)] px-6 py-5">
              <h2 id="usage-modal-title" className="text-xl font-semibold">
                Usage Performance
              </h2>
              <button
                onClick={closeUsageModal}
                className="rounded-lg border border-theme bg-theme-elevated p-2 text-muted transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                aria-label="Close modal"
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="px-6 py-6">
              {loadingStats ? (
                <div className="py-12 text-center">
                  <span className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)]/70 border-t-transparent"></span>
                  <p className="mt-4 text-sm text-muted">Compiling usage insights…</p>
                </div>
              ) : usageStats ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Total Uses</p>
                      <p className="mt-3 text-2xl font-semibold text-[var(--accent)]">
                        {usageStats.usage_count}
                      </p>
                    </div>
                    <div className="rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Revenue Influenced
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-emerald-200">
                        ${parseFloat(String(usageStats.total_revenue || 0)).toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">
                        Discount Given
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-amber-200">
                        ${parseFloat(String(usageStats.total_discount || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {usageStats.usage_history && usageStats.usage_history.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-[var(--text-main)]">
                        Usage History
                      </h3>
                      <div data-overlay-scroll className="max-h-96 space-y-3 overflow-y-auto pr-1">
                        {usageStats.usage_history.map((usage, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-theme bg-[rgba(255,255,255,0.03)] p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-[var(--text-main)]">
                                  Order #{usage.order_id?.slice(0, 8) ?? '—'}
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                  {usage.used_at
                                    ? new Date(usage.used_at).toLocaleString()
                                    : 'Unknown date'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-rose-200">
                                  -${parseFloat(String(usage.discount_amount || 0)).toFixed(2)}
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                  Order: ${parseFloat(String(usage.order_total || 0)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-muted">
                      No redemption activity tracked yet.
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-muted">
                  No usage statistics available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setCodeToDelete(null)
        }}
        onConfirm={handleDelete}
        title="Delete Discount Code"
        message="Are you sure you want to delete this discount code?\n\nThis action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </m.main>
  )
}

export default AdminDiscountCodes
