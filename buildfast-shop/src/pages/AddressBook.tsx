import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import toast from 'react-hot-toast'
import AddressCard from '../components/AddressCard'
import AddressModal from '../components/AddressModal'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import {
  fetchUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../lib/addressesApi'
import { pageFade } from '../components/animations/menuAnimations'
import { resolveLoyaltyState, resolveReferralInfo } from '../lib/loyaltyUtils'
import { useTheme as _useTheme } from '../shared/hooks/use-theme'
import { logger } from '../utils/logger'
import type { Address as AddressFormAddress } from '../components/AddressForm'

/**
 * Address interface matching the database schema
 * Compatible with AddressForm.Address
 */
interface Address extends AddressFormAddress {
  id: string | number
  fullName: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  country: string
  userId?: string
}

/**
 * AddressBook Page Component
 *
 * Manage multiple shipping addresses for the user.
 * Provides CRUD operations for addresses with loyalty program integration.
 *
 * @component
 */
const AddressBook = memo((): JSX.Element | null => {
  const { user } = useAuth()
  const navigate = useNavigate()
  // const isLightTheme = useTheme()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [success, setSuccess] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null)
  const { settings, loading: settingsLoading } = useStoreSettings()

  // Feature flags - default to false during loading
  const enableLoyalty = settingsLoading ? false : (settings?.enable_loyalty_program ?? true)

  const loyalty = useMemo(() => {
    if (!enableLoyalty) return null
    return resolveLoyaltyState()
  }, [enableLoyalty])

  const referral = useMemo(() => {
    if (!enableLoyalty || !user) return null
    return resolveReferralInfo(user)
  }, [user, enableLoyalty])

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent | { matches: boolean }): void => {
      setPrefersReducedMotion('matches' in e ? e.matches : false)
    }

    if (mediaQuery.addEventListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      setPrefersReducedMotion(mediaQuery.matches)
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
    return undefined
  }, [])

  const loadAddresses = useCallback(async (): Promise<void> => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      const result = await fetchUserAddresses(user.id)

      if (result.success && result.data) {
        setAddresses(result.data as unknown as Address[])
      } else {
        logger.error('Error loading addresses:', result.error)
        setError('Failed to load addresses. Please try again.')
      }
    } catch (err) {
      logger.error('Error in loadAddresses:', err)
      setError('An unexpected error occurred. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadAddresses()
  }, [user, navigate, loadAddresses])

  const handleAddNew = useCallback((): void => {
    setEditingAddress(null)
    setShowModal(true)
  }, [])

  const handleEdit = useCallback((address: AddressFormAddress): void => {
    setEditingAddress(address as Address)
    setShowModal(true)
  }, [])

  const handleSave = useCallback(
    async (formData: Partial<Address>): Promise<void> => {
      if (!user) return

      setSaving(true)
      setError('')

      try {
        const data = {
          ...formData,
          userId: user.id,
        }

        let result
        if (editingAddress) {
          // Update existing - exclude id from formData and convert to addressesApi.Address format
          const { id: _id, ...updateData } = formData as AddressFormAddress & {
            id?: string | number
          }
          result = await updateAddress(
            String(editingAddress.id),
            updateData as Partial<import('../lib/addressesApi').Address>
          )
        } else {
          // Create new - convert to addressesApi.Address format
          result = await createAddress(data as Partial<import('../lib/addressesApi').Address>)
        }

        if (result.success) {
          setSuccess(
            editingAddress ? 'Address updated successfully!' : 'Address added successfully!'
          )
          setTimeout(() => setSuccess(''), 3000)
          setShowModal(false)
          setEditingAddress(null)
          await loadAddresses()
        } else {
          logger.error('Error saving address:', result.error)
          const errorMsg =
            result.error instanceof Error
              ? result.error.message
              : String(result.error || 'Failed to save address')
          setError(errorMsg)
        }
      } catch (err) {
        logger.error('Error in handleSave:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setSaving(false)
      }
    },
    [user, editingAddress, loadAddresses]
  )

  const openDeleteConfirm = useCallback((address: AddressFormAddress): void => {
    setAddressToDelete(address as Address)
    setShowDeleteConfirm(true)
  }, [])

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!addressToDelete) return

    try {
      const result = await deleteAddress(String(addressToDelete.id))

      if (result.success) {
        setSuccess('Address deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setShowDeleteConfirm(false)
        setAddressToDelete(null)
        await loadAddresses()
      } else {
        logger.error('Error deleting address:', result.error)
        setError('Failed to delete address. Please try again.')
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      logger.error('Error in handleDelete:', err)
      setError('An unexpected error occurred. Please try again.')
      setTimeout(() => setError(''), 3000)
    }
  }, [addressToDelete, loadAddresses])

  const handleSetDefault = useCallback(
    async (address: AddressFormAddress): Promise<void> => {
      const addr = address as Address
      if (!user) return

      try {
        const result = await setDefaultAddress(String(addr.id), user.id)

        if (result.success) {
          setSuccess('Default address updated!')
          setTimeout(() => setSuccess(''), 3000)
          await loadAddresses()
        } else {
          logger.error('Error setting default address:', result.error)
          setError('Failed to set default address. Please try again.')
          setTimeout(() => setError(''), 3000)
        }
      } catch (err) {
        logger.error('Error in handleSetDefault:', err)
        setError('An unexpected error occurred. Please try again.')
        setTimeout(() => setError(''), 3000)
      }
    },
    [user, loadAddresses]
  )

  const handleCloseModal = useCallback((): void => {
    if (!saving) {
      setShowModal(false)
      setEditingAddress(null)
    }
  }, [saving])

  const handleReferralShare = useCallback(async (): Promise<void> => {
    if (!user) {
      toast.error('Sign in to share your referral link.')
      return
    }

    const { shareUrl, code } = resolveReferralInfo(user)

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Star Café Invite',
          text: 'Use my Star Café invite link to unlock bonus treats on your first visit.',
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard?.writeText(shareUrl)
      toast.success('Referral link copied!')
    } catch (error) {
      logger.error('Failed to share referral link:', error)
      try {
        await navigator.clipboard?.writeText(`${shareUrl} (Code: ${code})`)
        toast.success('Copied invite link.')
      } catch (clipboardError) {
        logger.error('Clipboard write failed:', clipboardError)
        toast.error('Unable to copy invite link right now.')
      }
    }
  }, [user])

  if (!user) {
    return null
  }

  return (
    <m.main
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]"
      data-animate="fade-scale"
      data-animate-active="false"
      variants={prefersReducedMotion ? {} : pageFade}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      exit={prefersReducedMotion ? undefined : 'exit'}
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
      role="main"
      aria-label="Address book page"
    >
      {/* Header */}
      <div
        className="bg-[var(--bg-main)]/40 border-b border-theme backdrop-blur"
        data-animate="fade-scale"
        data-animate-active="false"
      >
        <div className="app-container px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
            <div data-animate="fade-rise" data-animate-active="false">
              <p className="text-sm sm:text-xs uppercase tracking-[0.4em] text-[var(--text-main)]/40">
                Profile & Preferences
              </p>
              <h1 className="mt-3 text-xl sm:text-2xl md:text-3xl font-semibold gradient-text">
                Address Book
              </h1>
              <p className="mt-4 text-sm sm:text-base text-[var(--text-main)]/70 max-w-xl">
                Manage your shipping addresses for faster checkout
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="btn-primary min-h-[44px] gap-2 px-4 sm:px-6 md:px-10 py-3 text-sm sm:text-base uppercase tracking-wide shadow-[0_10px_40px_rgba(var(--accent-rgb),0.35)] hover:shadow-[0_16px_50px_rgba(var(--accent-rgb),0.45)] transition"
              data-animate="fade-scale"
              data-animate-active="false"
              style={{ transitionDelay: '160ms' }}
              aria-label="Add new address"
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
              Add New Address
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="app-container px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        {enableLoyalty && loyalty && (
          <div className="glow-surface glow-soft mb-8 overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.25),transparent_60%)]"
              aria-hidden="true"
            />
            <div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 max-w-xl">
                <p className="text-sm sm:text-xs uppercase tracking-[0.3em] text-[var(--color-amber)]/70">
                  Star Rewards
                </p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">
                  {loyalty.tier} · {loyalty.projectedPoints} pts
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-main)]/70">
                  {(loyalty.pointsToNextTier ?? 0) > 0
                    ? `${loyalty.pointsToNextTier} points until ${loyalty.nextTierLabel}. Keep dining to unlock the next tier perks.`
                    : 'You&apos;re at the top tier—thank you for being a VIP!'}
                </p>
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6 pt-2">
                  <div
                    className="relative h-2 w-full max-w-xs rounded-full bg-white/10 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={loyalty.progressPercent ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Loyalty progress"
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--color-amber)] via-[var(--color-orange)] to-[var(--color-orange)] transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(loyalty.progressPercent ?? 0, 4))}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm sm:text-xs font-semibold text-[var(--color-amber)] whitespace-nowrap">
                    {loyalty.progressPercent ?? 0}%
                  </span>
                </div>
                <p className="text-sm sm:text-xs text-[var(--text-main)]/60">
                  {(loyalty.redeemableRewards?.length ?? 0) > 0
                    ? `${loyalty.redeemableRewards?.length ?? 0} rewards ready to redeem now.`
                    : 'Complete a few more visits to reveal fresh rewards.'}
                </p>
              </div>
              {referral && (
                <div className="flex w-full max-w-xs flex-col gap-3 sm:gap-4 md:gap-6 rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur-sm">
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                      {referral.headline}
                    </p>
                    <p className="mt-1 text-sm sm:text-xs text-[var(--text-main)]/70">
                      {referral.subcopy}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)]/30 px-4 sm:px-6 md:px-10 py-3">
                    <span className="text-sm sm:text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">
                      Code
                    </span>
                    <span className="font-semibold text-[var(--color-amber)] text-sm sm:text-base">
                      {referral.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReferralShare}
                    className="inline-flex items-center justify-center min-h-[44px] gap-2 rounded-xl sm:rounded-2xl bg-[var(--accent)] px-4 sm:px-6 md:px-10 py-3 text-sm sm:text-base font-semibold text-black transition hover:bg-[var(--accent)]/90 active:scale-95"
                    aria-label="Share referral invite link"
                  >
                    Share Invite Link
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 12v7a1 1 0 0 0 1 1h7"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 15v4a2 2 0 0 1-2 2h-4"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="m10 14 11-11" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            className="mb-6 rounded-xl sm:rounded-2xl border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur"
            data-animate="fade-scale"
            data-animate-active="false"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <svg
                className="w-5 h-5 text-[var(--color-emerald)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm sm:text-base font-medium text-[var(--color-emerald)]">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 rounded-xl sm:rounded-2xl border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur"
            data-animate="fade-scale"
            data-animate-active="false"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <svg
                className="w-5 h-5 text-[var(--color-red)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm sm:text-base font-medium text-[var(--color-red)]">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div
                  className="card-soft px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <div className="h-6 bg-white/10 rounded w-24 mb-4" aria-hidden="true"></div>
                  <div className="space-y-3" aria-hidden="true">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          /* Empty State */
          <div
            className="card-soft glow-soft border-dashed border-theme-strong px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4"
              aria-hidden="true"
            >
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-2">
              No addresses yet
            </h3>
            <p className="text-sm sm:text-base text-[var(--text-main)]/60 mb-6 max-w-md mx-auto">
              Add your first shipping address to make checkout faster and easier
            </p>
            <button
              onClick={handleAddNew}
              className="btn-primary min-h-[44px] gap-2 px-4 sm:px-6 md:px-10 py-3 text-sm sm:text-base uppercase tracking-wide"
              aria-label="Add your first address"
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
              Add Your First Address
            </button>
          </div>
        ) : (
          /* Address Cards Grid */
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
            role="list"
            aria-label="Saved addresses"
          >
            {addresses.map((address, index) => (
              <div key={address.id} role="listitem">
                <AddressCard
                  address={address}
                  onEdit={handleEdit}
                  onDelete={openDeleteConfirm}
                  onSetDefault={handleSetDefault}
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 100}ms` }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showModal}
        onClose={handleCloseModal}
        address={editingAddress}
        onSave={handleSave}
        loading={saving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setAddressToDelete(null)
        }}
        onConfirm={handleDelete}
        title="Delete Address"
        message={`Are you sure you want to delete this address?\n\n${addressToDelete?.fullName || ''}\n${addressToDelete?.addressLine1 || ''}\n\nThis action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </m.main>
  )
})

AddressBook.displayName = 'AddressBook'

export default AddressBook
