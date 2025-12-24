export interface LoyaltySnapshot {
  tier: string
  currentPoints: number
  nextTierThreshold: number
  nextTierLabel: string
  pointsMultiplier: number
}

export interface Reward {
  id: string
  label: string
  cost: number
}

export function getLoyaltySnapshot(): LoyaltySnapshot
export function updateLoyaltyPoints(points: number): void
export function getRewardsCatalog(): Reward[]
export function redeemReward(rewardId: string): { success: boolean; error?: string }
export function resolveLoyaltyState(orderTotal?: number): LoyaltySnapshot & {
  pointsEarnedThisOrder?: number
  projectedPoints?: number
  progressPercent?: number
  pointsToNextTier?: number
  redeemableRewards?: Reward[]
  newlyUnlockedRewards?: Reward[]
  rewardsCatalog?: Reward[]
}
export interface ReferralInfo {
  code: string | null
  shareUrl: string
  headline: string
  subcopy: string
}
export function resolveReferralInfo(user: { id: string } | null): ReferralInfo
