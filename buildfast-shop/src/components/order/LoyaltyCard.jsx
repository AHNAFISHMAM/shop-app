import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Loyalty Card Component
 * Displays loyalty progress with animations and reward management
 */
const LoyaltyCard = ({
  loyalty,
  onApplyReward,
  onRemoveReward,
}) => {
  const [showRewards, setShowRewards] = useState(false);
  const availableRewards = loyalty?.redeemableRewards || [];
  const upcomingRewards = loyalty?.newlyUnlockedRewards || [];
  const progressPercent = loyalty?.progressPercent ?? 0;

  return (
    <motion.div
      className="cart-loyalty-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="cart-loyalty-header">
        <span>Loyalty</span>
        <span>{loyalty?.tier || 'Member'}</span>
      </div>

      {/* Progress Bar */}
      <div className="cart-loyalty-progress-container">
        <motion.div
          className="cart-loyalty-progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(progressPercent, 4))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Loyalty progress"
        />
      </div>

      {/* Points Info */}
      <div className="cart-loyalty-points">
        <span>{loyalty?.currentPoints ?? 0} pts</span>
        <span>
          {Math.max(0, loyalty?.pointsToNextTier ?? 0)} pts to {loyalty?.nextTierLabel || 'next tier'}
        </span>
      </div>

      {/* Projected Points */}
      <div className="cart-loyalty-projected">
        +{loyalty?.pointsEarnedThisOrder ?? 0} pts projected this order
      </div>

      {/* Rewards Toggle */}
      <button
        type="button"
        onClick={() => setShowRewards((prev) => !prev)}
        aria-expanded={showRewards}
        aria-controls="rewards-list"
        className="cart-loyalty-toggle-btn"
      >
        {showRewards ? 'Hide Rewards' : 'Apply Rewards'}
      </button>

      {/* Rewards List */}
      <AnimatePresence>
        {showRewards && (
          <motion.div
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
                <ul className="cart-loyalty-rewards-list">
                  {availableRewards.map((reward) => (
                    <motion.li
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
                            className="cart-loyalty-reward-apply"
                            aria-label={`Apply ${reward.label}`}
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="cart-loyalty-message">
                Earn {Math.max(0, loyalty?.pointsToNextTier ?? 0)} more pts to unlock your next perk.
              </p>
            )}
            {upcomingRewards.length > 0 && (
              <div>
                <p className="cart-loyalty-rewards-section-title">Unlocking soon</p>
                <ul className="cart-loyalty-rewards-list" style={{ color: 'rgba(251, 191, 36, 0.8)' }}>
                  {upcomingRewards.map((reward) => (
                    <li key={reward.id} className="cart-loyalty-reward-upcoming">
                      <span className="cart-loyalty-reward-upcoming-label">{reward.label}</span>
                      <span className="cart-loyalty-reward-upcoming-cost">{reward.cost} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

LoyaltyCard.propTypes = {
  loyalty: PropTypes.shape({
    tier: PropTypes.string,
    currentPoints: PropTypes.number,
    nextTierThreshold: PropTypes.number,
    nextTierLabel: PropTypes.string,
    pointsEarnedThisOrder: PropTypes.number,
    progressPercent: PropTypes.number,
    pointsToNextTier: PropTypes.number,
    redeemableRewards: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        cost: PropTypes.number.isRequired,
      })
    ),
    newlyUnlockedRewards: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        cost: PropTypes.number.isRequired,
      })
    ),
  }),
  onApplyReward: PropTypes.func,
  onRemoveReward: PropTypes.func,
};

export default LoyaltyCard;

