import { logger } from '../utils/logger'

const DEFAULT_SNAPSHOT = {
  tier: 'Gold',
  currentPoints: 1320,
  nextTierThreshold: 2000,
  nextTierLabel: 'Platinum',
  pointsMultiplier: 1.5,
}

const REWARDS_CATALOG = [
  { id: 'dessert', label: 'Complimentary Dessert', cost: 300 },
  { id: 'mocktails', label: 'Round of Signature Mocktails', cost: 450 },
  { id: 'chef-table', label: 'Chef Table Upgrade', cost: 750 },
  { id: 'vip-night', label: 'VIP Tasting Night Invite', cost: 1200 },
]

const readSnapshot = () => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SNAPSHOT }
  }

  try {
    const raw = window.localStorage.getItem('loyalty_snapshot')
    if (!raw) {
      window.localStorage.setItem('loyalty_snapshot', JSON.stringify(DEFAULT_SNAPSHOT))
      return { ...DEFAULT_SNAPSHOT }
    }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_SNAPSHOT,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    }
  } catch (error) {
    logger.error('Failed to read loyalty snapshot:', error)
    return { ...DEFAULT_SNAPSHOT }
  }
}

export const resolveLoyaltyState = (orderTotal = 0) => {
  const snapshot = readSnapshot()
  const multiplier = snapshot.pointsMultiplier ?? DEFAULT_SNAPSHOT.pointsMultiplier
  const pointsEarnedThisOrder = Math.max(0, Math.round(orderTotal * (multiplier || 1)))
  const projectedPoints = snapshot.currentPoints + pointsEarnedThisOrder
  const nextTierThreshold = snapshot.nextTierThreshold || 2000
  const progressPercent = Math.min(100, Math.round((projectedPoints / nextTierThreshold) * 100))
  const pointsToNextTier = Math.max(0, nextTierThreshold - projectedPoints)

  const redeemableRewards = REWARDS_CATALOG.filter(reward => snapshot.currentPoints >= reward.cost)
  const newlyUnlockedRewards = REWARDS_CATALOG.filter(
    reward => reward.cost <= projectedPoints && reward.cost > snapshot.currentPoints
  )

  return {
    ...snapshot,
    pointsEarnedThisOrder,
    projectedPoints,
    progressPercent,
    pointsToNextTier,
    redeemableRewards,
    newlyUnlockedRewards,
    rewardsCatalog: REWARDS_CATALOG,
  }
}

const REFERRAL_PREFIX = 'sc-ref'

const ensureReferralCode = userId => {
  if (!userId || typeof window === 'undefined') return null
  const storageKey = `${REFERRAL_PREFIX}:${userId}`
  try {
    const existing = window.localStorage.getItem(storageKey)
    if (existing) return existing
    const randomToken = Math.random().toString(36).slice(2, 8).toUpperCase()
    const code = `STAR-${randomToken}`
    window.localStorage.setItem(storageKey, code)
    return code
  } catch (error) {
    logger.error('Failed to generate referral code:', error)
    return `STAR-${userId.slice(0, 6).toUpperCase()}`
  }
}

export const resolveReferralInfo = user => {
  if (!user) {
    return {
      code: null,
      shareUrl: '',
      headline: 'Join Star Rewards',
      subcopy: 'Sign in to track points, unlock perks, and share invite links with friends.',
    }
  }

  const code = ensureReferralCode(user.id)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://star-cafe.app'
  const shareUrl = `${origin}/?ref=${code}`

  return {
    code,
    shareUrl,
    headline: 'Refer friends, earn bonus treats',
    subcopy:
      'Each new guest who books with your link unlocks 250 bonus points after their first visit.',
  }
}

export default resolveLoyaltyState
