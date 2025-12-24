/**
 * OrderSummarySidebar Component
 *
 * Displays order totals, discount codes, loyalty program, and payment button.
 */

import { useState } from 'react'
import { formatCurrency } from '../utils/formatting'
import type { FulfillmentMode } from '../types'

interface OrderSummarySidebarProps {
  // Totals
  totalItemsCount: number
  subtotal: number
  shipping: number
  tax: number
  taxRatePercent: number
  grandTotal: number

  // Discount
  discountCodeInput: string
  appliedDiscountCode: unknown | null
  discountAmount: number
  discountError: string
  validatingDiscount: boolean
  onDiscountCodeChange: (code: string) => void
  onApplyDiscount: () => void
  onRemoveDiscount: () => void

  // Loyalty
  enableLoyaltyProgram: boolean
  loyalty: {
    tier?: string
    progressPercent?: number
    currentPoints?: number
    pointsToNextTier?: number
    nextTierLabel?: string
    pointsEarnedThisOrder?: number
    redeemableRewards?: Array<{ id: string; label: string; cost: number }>
    newlyUnlockedRewards?: Array<{ id: string; label: string; cost: number }>
  } | null

  // Order state
  placingOrder: boolean
  orderSuccess: boolean
  showPayment: boolean
  fulfillmentMode: FulfillmentMode

  // Theme
  isLightTheme: boolean

  // Actions
  onPlaceOrder: () => void
}

export function OrderSummarySidebar({
  totalItemsCount,
  subtotal,
  shipping,
  tax,
  taxRatePercent,
  grandTotal,
  discountCodeInput,
  appliedDiscountCode,
  discountAmount,
  discountError,
  validatingDiscount,
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  enableLoyaltyProgram,
  loyalty,
  placingOrder,
  orderSuccess,
  showPayment,
  fulfillmentMode,
  isLightTheme,
  onPlaceOrder,
}: OrderSummarySidebarProps) {
  const [showRewardsPanel, setShowRewardsPanel] = useState(false)

  return (
    <div
      className="glow-surface glow-strong border border-theme rounded-xl p-6 sticky top-4"
      style={{
        backgroundColor: isLightTheme ? 'var(--bg-elevated)' : 'rgba(255, 255, 255, 0.05)',
      }}
    >
      <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">Total</h2>

      {/* Loyalty Program */}
      {enableLoyaltyProgram && loyalty && (
        <div className="mb-4 rounded-xl border border-[#C59D5F]/30 bg-[#C59D5F]/10 p-4 text-xs text-amber-100/80">
          <div className="flex items-center justify-between uppercase tracking-[0.2em] text-[10px] text-amber-200/70">
            <span>Loyalty</span>
            <span>{loyalty.tier || 'Member'}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-main)]/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#D97706] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(loyalty.progressPercent ?? 0, 4))}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-amber-100/90">
            <span>{loyalty.currentPoints ?? 0} pts</span>
            <span>
              {Math.max(0, loyalty.pointsToNextTier ?? 0)} pts to{' '}
              {loyalty.nextTierLabel || 'next tier'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-100/80">
            +{loyalty.pointsEarnedThisOrder ?? 0} pts projected this order
          </div>
          <button
            type="button"
            onClick={() => setShowRewardsPanel(prev => !prev)}
            className="mt-3 w-full rounded-lg border border-theme bg-[var(--bg-main)]/30 px-3 py-3 text-xs sm:text-sm font-semibold text-[var(--text-main)] transition hover:border-[#C59D5F]/50 hover:text-[#C59D5F] min-h-[44px]"
          >
            {showRewardsPanel ? 'Hide Rewards' : 'Apply Rewards'}
          </button>
          {showRewardsPanel && (
            <div className="mt-3 space-y-2 rounded-lg border border-theme bg-[var(--bg-main)]/40 p-3">
              {loyalty.redeemableRewards?.length ? (
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-[var(--text-main)]">
                    Available now
                  </p>
                  <ul className="space-y-1 text-[11px] text-amber-50/90">
                    {loyalty.redeemableRewards.map(reward => (
                      <li
                        key={reward.id}
                        className="flex items-center justify-between rounded-md px-2 py-1"
                        style={{
                          backgroundColor: isLightTheme
                            ? 'rgba(0, 0, 0, 0.04)'
                            : 'rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <span className="truncate pr-2">{reward.label}</span>
                        <span className="text-amber-200 font-semibold">{reward.cost} pts</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[11px] text-amber-100/70">
                  Earn {Math.max(0, loyalty.pointsToNextTier ?? 0)} more pts to unlock your next
                  perk.
                </p>
              )}
              {loyalty.newlyUnlockedRewards?.length ? (
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-[var(--text-main)]">
                    Unlocking soon
                  </p>
                  <ul className="space-y-1 text-[11px] text-amber-50/80">
                    {loyalty.newlyUnlockedRewards.map(reward => (
                      <li key={reward.id} className="flex items-center justify-between px-2 py-1">
                        <span className="truncate pr-2">{reward.label}</span>
                        <span className="text-amber-200">{reward.cost} pts</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Total Items Count */}
      <div className="mb-4 pb-4 border-b border-theme">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">Total Items</span>
          <span className="text-base font-semibold text-[var(--text-main)]">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Discount Code Section */}
      <div className="mb-4 pb-4 border-b border-theme">
        {!appliedDiscountCode ? (
          <div>
            <label
              htmlFor="discountCode"
              className="block text-sm font-medium text-[var(--text-main)] mb-2"
            >
              Discount Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="discountCode"
                value={discountCodeInput}
                onChange={e => {
                  onDiscountCodeChange(e.target.value.toUpperCase())
                }}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onApplyDiscount()
                  }
                }}
                placeholder="Enter code"
                disabled={validatingDiscount || placingOrder || orderSuccess}
                className="flex-1 px-3 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition uppercase disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
              />
              <button
                type="button"
                onClick={onApplyDiscount}
                disabled={
                  validatingDiscount || placingOrder || orderSuccess || !discountCodeInput.trim()
                }
                className="px-4 py-3 bg-accent text-black rounded-lg hover:bg-accent/80 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px]"
              >
                {validatingDiscount ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            {discountError && <p className="mt-2 text-xs text-red-400">{discountError}</p>}
          </div>
        ) : (
          <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-400 mb-1">Discount Applied</p>
                <p className="text-sm text-[var(--text-main)]">
                  {(appliedDiscountCode as { code?: string; discount_code?: string }).code ||
                    (appliedDiscountCode as { code?: string; discount_code?: string })
                      .discount_code ||
                    'Discount'}
                </p>
                {(
                  appliedDiscountCode as {
                    discount_type?: string
                    discount_value?: number | string
                  }
                ).discount_type === 'percentage' ? (
                  <p className="text-xs text-muted">
                    {
                      (
                        appliedDiscountCode as {
                          discount_type?: string
                          discount_value?: number | string
                        }
                      ).discount_value
                    }
                    % off
                  </p>
                ) : (
                  <p className="text-xs text-muted">
                    {formatCurrency(
                      parseFloat(
                        String(
                          (
                            appliedDiscountCode as {
                              discount_type?: string
                              discount_value?: number | string
                            }
                          ).discount_value || 0
                        )
                      )
                    )}{' '}
                    off
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onRemoveDiscount}
                disabled={placingOrder || orderSuccess}
                className="text-red-400 hover:text-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Remove discount code"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Totals Breakdown */}
      <div className="space-y-3 mb-4 pb-4 border-b border-theme">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="font-semibold text-[var(--text-main)]">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">
            Shipping{' '}
            {fulfillmentMode === 'delivery' ? `(${subtotal > 500 ? 'Free' : '৳50'})` : '(Free)'}
          </span>
          <span className="text-[var(--text-main)]">{formatCurrency(shipping)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">Tax ({taxRatePercent}%)</span>
          <span className="font-semibold text-[var(--text-main)]">{formatCurrency(tax)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-green-400">
            <span className="text-sm font-medium">Discount</span>
            <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-[var(--text-main)]">Total</span>
          <span className="text-2xl font-bold text-accent">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* Place Order Button */}
      {!showPayment && (
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={placingOrder || orderSuccess}
          className="w-full bg-gradient-to-r from-accent to-accent/80 text-black py-4 rounded-lg font-bold text-lg hover:from-accent/90 hover:to-accent/70 focus:outline-none focus:ring-4 focus:ring-accent/30 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 min-h-[44px]"
        >
          {placingOrder ? (
            <>
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
              Processing Order...
            </>
          ) : orderSuccess ? (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Order Created!
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              Continue to Payment
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </>
          )}
        </button>
      )}

      {/* Security Info */}
      {!showPayment && !orderSuccess && (
        <p className="text-center text-sm text-muted mt-3 flex items-center justify-center gap-1">
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Secure payment powered by Stripe
        </p>
      )}
    </div>
  )
}
