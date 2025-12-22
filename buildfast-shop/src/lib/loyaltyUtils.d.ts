/**
 * Type declarations for loyalty utilities
 */
export interface LoyaltyState {
  tier: string;
  currentPoints: number;
  nextTierThreshold: number;
  nextTierLabel: string;
  pointsMultiplier: number;
  pointsEarnedThisOrder: number;
  projectedPoints: number;
  progressPercent: number;
  pointsToNextTier: number;
  redeemableRewards: Array<{ id: string; label: string; cost: number }>;
  newlyUnlockedRewards: Array<{ id: string; label: string; cost: number }>;
}

export function resolveLoyaltyState(orderTotal?: number): LoyaltyState;

