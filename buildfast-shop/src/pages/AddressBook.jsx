import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useStoreSettings } from '../contexts/StoreSettingsContext'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import AddressCard from '../components/AddressCard'
import AddressModal from '../components/AddressModal'
import {
  fetchUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../lib/addressesApi'
import UpdateTimestamp from '../components/UpdateTimestamp'
import { pageFade } from '../components/animations/menuAnimations'
import { resolveLoyaltyState, resolveReferralInfo } from '../lib/loyaltyUtils'
import { logger } from '../utils/logger'

/**
 * AddressBook Page
 *
 * Manage multiple shipping addresses for the user
 */
function AddressBook() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
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

  const loadAddresses = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      const result = await fetchUserAddresses(user.id)

      if (result.success) {
        setAddresses(result.data)
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

  const handleAddNew = () => {
    setEditingAddress(null)
    setShowModal(true)
  }

  const handleEdit = (address) => {
    setEditingAddress(address)
    setShowModal(true)
  }

  const handleSave = async (formData) => {
    setSaving(true)
    setError('')

    try {
      const data = {
        ...formData,
        userId: user.id
      }

      let result
      if (editingAddress) {
        // Update existing
        result = await updateAddress(editingAddress.id, formData)
      } else {
        // Create new
        result = await createAddress(data)
      }

      if (result.success) {
        setSuccess(editingAddress ? 'Address updated successfully!' : 'Address added successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setShowModal(false)
        setEditingAddress(null)
        await loadAddresses()
      } else {
        logger.error('Error saving address:', result.error)
        setError(result.message || 'Failed to save address. Please try again.')
      }
    } catch (err) {
      logger.error('Error in handleSave:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (address) => {
    if (!confirm(`Are you sure you want to delete this address?\n\n${address.fullName}\n${address.addressLine1}`)) {
      return
    }

    try {
      const result = await deleteAddress(address.id)

      if (result.success) {
        setSuccess('Address deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
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
  }

  const handleSetDefault = async (address) => {
    try {
      const result = await setDefaultAddress(address.id, user.id)

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
  }

  const handleCloseModal = () => {
    if (!saving) {
      setShowModal(false)
      setEditingAddress(null)
    }
  }

  const handleReferralShare = useCallback(async () => {
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
    <motion.main
      className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]"
      data-animate="fade-scale"
      data-animate-active="false"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <UpdateTimestamp />
      {/* Header */}
      <div
        className="bg-[var(--bg-main)]/40 border-b border-theme backdrop-blur"
        data-animate="fade-scale"
        data-animate-active="false"
      >
        <div className="app-container px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
            <div
              data-animate="fade-rise"
              data-animate-active="false"
            >
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-[var(--text-main)]/40">
                Profile & Preferences
              </p>
              <h1 className="mt-3 text-xl sm:text-2xl md:text-3xl font-semibold gradient-text">Address Book</h1>
              <p className="mt-4 text-sm sm:text-base text-[var(--text-main)]/70 max-w-xl">
                Manage your shipping addresses for faster checkout
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="btn-primary min-h-[44px] gap-2 px-4 sm:px-6 md:px-10 py-3 text-sm sm:text-base uppercase tracking-wide shadow-[0_10px_40px_rgba(197,157,95,0.35)] hover:shadow-[0_16px_50px_rgba(197,157,95,0.45)] transition"
              data-animate="fade-scale"
              data-animate-active="false"
              style={{ transitionDelay: '160ms' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Address
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="app-container px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
        {enableLoyalty && loyalty && (
          <div className="glow-surface glow-strong mb-8 overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)] px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,157,95,0.25),transparent_60%)]" />
            <div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 max-w-xl">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#F5DEB3]/70">Star Rewards</p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)]">
                  {loyalty.tier} · {loyalty.projectedPoints} pts
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-main)]/70">
                  {loyalty.pointsToNextTier > 0
                    ? `${loyalty.pointsToNextTier} points until ${loyalty.nextTierLabel}. Keep dining to unlock the next tier perks.`
                    : 'You&apos;re at the top tier—thank you for being a VIP!'}
                </p>
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6 pt-2">
                  <div className="relative h-2 w-full max-w-xs rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#D97706] transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(loyalty.progressPercent, 4))}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-[#FDE68A] whitespace-nowrap">
                    {loyalty.progressPercent}%
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--text-main)]/60">
                  {loyalty.redeemableRewards.length > 0
                    ? `${loyalty.redeemableRewards.length} rewards ready to redeem now.`
                    : 'Complete a few more visits to reveal fresh rewards.'}
                </p>
              </div>
              {referral && (
                <div className="flex w-full max-w-xs flex-col gap-3 sm:gap-4 md:gap-6 rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur-sm">
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-[var(--text-main)]">{referral.headline}</p>
                    <p className="mt-1 text-[10px] sm:text-xs text-[var(--text-main)]/70">{referral.subcopy}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-theme bg-[var(--bg-main)]/30 px-4 sm:px-6 md:px-10 py-3">
                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">Code</span>
                    <span className="font-semibold text-[#FDE68A] text-sm sm:text-base">{referral.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReferralShare}
                    className="inline-flex items-center justify-center min-h-[44px] gap-2 rounded-xl sm:rounded-2xl bg-[#C59D5F] px-4 sm:px-6 md:px-10 py-3 text-sm sm:text-base font-semibold text-black transition hover:bg-[#d6b37b] active:scale-95"
                  >
                    Share Invite Link
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a1 1 0 0 0 1 1h7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2h-4" />
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
            className="mb-6 rounded-xl sm:rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base font-medium text-emerald-200">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 rounded-xl sm:rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <svg className="w-5 h-5 text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base font-medium text-rose-100">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div
                  className="card-soft px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <div className="h-6 bg-white/10 rounded w-24 mb-4"></div>
                  <div className="space-y-3">
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
            className="card-soft border-dashed border-theme-strong px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-center"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-main)] mb-2">No addresses yet</h3>
            <p className="text-sm sm:text-base text-[var(--text-main)]/60 mb-6 max-w-md mx-auto">
              Add your first shipping address to make checkout faster and easier
            </p>
            <button
              onClick={handleAddNew}
              className="btn-primary min-h-[44px] gap-2 px-4 sm:px-6 md:px-10 py-3 text-sm sm:text-base uppercase tracking-wide"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Address
            </button>
          </div>
        ) : (
          /* Address Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {addresses.map((address, index) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                data-animate="fade-rise"
                data-animate-active="false"
                style={{ transitionDelay: `${index * 100}ms` }}
              />
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
    </motion.main>
  )
}

export default AddressBook
