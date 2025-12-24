import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'

/**
 * RedeemableReward interface
 */
export interface RedeemableReward {
  id: string
  label: string
  cost: number
}

/**
 * LoyaltyState interface
 */
export interface LoyaltyState {
  tier?: string
  currentPoints?: number
  nextTierThreshold?: number
  nextTierLabel?: string
  pointsEarnedThisOrder?: number
  progressPercent?: number
  pointsToNextTier?: number
  redeemableRewards?: RedeemableReward[]
  newlyUnlockedRewards?: RedeemableReward[]
}

/**
 * LoyaltyCardProps interface
 */
export interface LoyaltyCardProps {
  loyalty?: LoyaltyState
  onApplyReward?: (rewardId: string) => void
  onRemoveReward?: (rewardId: string) => void
}

/**
 * Enhanced Loyalty Card Component
 * Displays loyalty progress with animations and reward management
 *
 * @param {LoyaltyCardProps} props - Component props
 */
const LoyaltyCard = ({ loyalty, onApplyReward }: LoyaltyCardProps) => {
  const [showRewards, setShowRewards] = useState<boolean>(false)
  const availableRewards = loyalty?.redeemableRewards || []
  const upcomingRewards = loyalty?.newlyUnlockedRewards || []
  const progressPercent = loyalty?.progressPercent ?? 0

  return (
    <m.div
      className="cart-loyalty-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label="Loyalty program information"
    >
      <div className="cart-loyalty-header">
        <span>Loyalty</span>
        <span>{loyalty?.tier || 'Member'}</span>
      </div>

      {/* Progress Bar */}
      <div className="cart-loyalty-progress-container">
        <m.div
          className="cart-loyalty-progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(progressPercent, 4))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loyalty progress"
        />
      </div>

      {/* Points Info */}
      <div className="cart-loyalty-points">
        <span>{loyalty?.currentPoints ?? 0} pts</span>
        <span>
          {Math.max(0, loyalty?.pointsToNextTier ?? 0)} pts to{' '}
          {loyalty?.nextTierLabel || 'next tier'}
        </span>
      </div>

      {/* Projected Points */}
      <div className="cart-loyalty-projected">
        +{loyalty?.pointsEarnedThisOrder ?? 0} pts projected this order
      </div>

      {/* Rewards Toggle */}
      <button
        type="button"
        onClick={() => setShowRewards(prev => !prev)}
        aria-expanded={showRewards}
        aria-controls="rewards-list"
        className="cart-loyalty-toggle-btn min-h-[44px]"
        aria-label={showRewards ? 'Hide rewards' : 'Show available rewards'}
      >
        {showRewards ? 'Hide Rewards' : 'Apply Rewards'}
      </button>

      {/* Rewards List */}
      <AnimatePresence>
        {showRewards && (
          <m.div
            id="rewards-list"
            role="region"
            aria-label="Available rewards"
            className="cart-loyalty-rewards"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {availableRewards.length > 0 ? (
              <div>
                <p className="cart-loyalty-rewards-section-title">Available now</p>
                <ul className="cart-loyalty-rewards-list" role="list">
                  {availableRewards.map(reward => (
                    <m.li
                      key={reward.id}
                      className="cart-loyalty-reward-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="cart-loyalty-reward-label">{reward.label}</span>
                      <div className="cart-loyalty-reward-actions">
                        <span className="cart-loyalty-reward-cost">{reward.cost} pts</span>
                        {onApplyReward && (
                          <button
                            onClick={() => onApplyReward(reward.id)}
                            className="cart-loyalty-reward-apply min-h-[44px]"
                            aria-label={`Apply ${reward.label} reward`}
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </m.li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="cart-loyalty-message">
                Earn {Math.max(0, loyalty?.pointsToNextTier ?? 0)} more pts to unlock your next
                perk.
              </p>
            )}
            {upcomingRewards.length > 0 && (
              <div>
                <p className="cart-loyalty-rewards-section-title">Unlocking soon</p>
                <ul
                  className="cart-loyalty-rewards-list"
                  style={{ color: 'rgba(var(--color-amber-rgb), 0.8)' }}
                  role="list"
                >
                  {upcomingRewards.map(reward => (
                    <li key={reward.id} className="cart-loyalty-reward-upcoming">
                      <span className="cart-loyalty-reward-upcoming-label">{reward.label}</span>
                      <span className="cart-loyalty-reward-upcoming-cost">{reward.cost} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  )
}

export default LoyaltyCard
