/**
 * ShippingAddressForm Component
 *
 * Form for entering shipping address manually.
 */

import { Link } from 'react-router-dom'
import type { ShippingAddress } from '../types'

interface ShippingAddressFormProps {
  address: ShippingAddress
  onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  showOrderNote: boolean
  orderNote: string
  onOrderNoteToggle: () => void
  onOrderNoteChange: (note: string) => void
  enableMarketingOptins: boolean
  emailUpdatesOptIn: boolean
  smsUpdatesOptIn: boolean
  onEmailOptInChange: (checked: boolean) => void
  onSmsOptInChange: (checked: boolean) => void
  placingOrder: boolean
  orderSuccess: boolean
  showPayment: boolean
  user: { id?: string } | null
  savedAddressesCount: number
  useManualAddress: boolean
  onBackToSavedAddresses?: () => void
  onSubmit: (e: React.FormEvent) => void
  isAddressValid: () => boolean
  isLightTheme: boolean
}

export function ShippingAddressForm({
  address,
  onAddressChange,
  showOrderNote,
  orderNote,
  onOrderNoteToggle,
  onOrderNoteChange,
  enableMarketingOptins,
  emailUpdatesOptIn,
  smsUpdatesOptIn,
  onEmailOptInChange,
  onSmsOptInChange,
  placingOrder,
  orderSuccess,
  showPayment,
  user,
  savedAddressesCount,
  useManualAddress,
  onBackToSavedAddresses,
  onSubmit,
  isAddressValid,
  isLightTheme,
}: ShippingAddressFormProps) {
  return (
    <div
      className="glow-surface glow-strong border border-theme rounded-xl p-6"
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-accent flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
          <h2 className="text-xl font-bold text-[var(--text-main)]">Shipping Address</h2>
        </div>
        {user && savedAddressesCount === 0 && (
          <Link
            to="/addresses"
            className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Save Address for Later
          </Link>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-[var(--text-main)] mb-1"
          >
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={address.fullName}
            onChange={onAddressChange}
            placeholder="John Doe"
            required
            disabled={placingOrder || orderSuccess}
            className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          />
        </div>

        {/* Street Address */}
        <div>
          <label
            htmlFor="streetAddress"
            className="block text-sm font-medium text-[var(--text-main)] mb-1"
          >
            Street Address <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            value={address.streetAddress}
            onChange={onAddressChange}
            placeholder="123 Main Street"
            required
            disabled={placingOrder || orderSuccess}
            className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          />
        </div>

        {/* City and State/Province */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-[var(--text-main)] mb-1"
            >
              City <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={address.city}
              onChange={onAddressChange}
              placeholder="New York"
              required
              disabled={placingOrder || orderSuccess}
              className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            />
          </div>
          <div>
            <label
              htmlFor="stateProvince"
              className="block text-sm font-medium text-[var(--text-main)] mb-1"
            >
              State/Province <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="stateProvince"
              name="stateProvince"
              value={address.stateProvince}
              onChange={onAddressChange}
              placeholder="NY"
              required
              disabled={placingOrder || orderSuccess}
              className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            />
          </div>
        </div>

        {/* Postal Code and Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="postalCode"
              className="block text-sm font-medium text-[var(--text-main)] mb-1"
            >
              Postal/ZIP Code <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={address.postalCode}
              onChange={onAddressChange}
              placeholder="10001"
              required
              disabled={placingOrder || orderSuccess}
              className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            />
          </div>
          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-[var(--text-main)] mb-1"
            >
              Country <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={address.country}
              onChange={onAddressChange}
              placeholder="United States"
              required
              disabled={placingOrder || orderSuccess}
              className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-[var(--text-main)] mb-1"
          >
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={address.phoneNumber}
            onChange={onAddressChange}
            placeholder="+1 (555) 123-4567"
            required
            disabled={placingOrder || orderSuccess}
            className="w-full px-4 py-3 bg-theme-elevated border border-theme rounded-lg text-[var(--text-main)] placeholder-muted focus:ring-2 focus:ring-accent focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          />
        </div>

        {/* Order Note */}
        <div className="pt-4 border-t border-theme">
          <button
            type="button"
            onClick={onOrderNoteToggle}
            className="flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {showOrderNote ? 'Remove order note' : 'Add order note for the kitchen'}
          </button>
          {showOrderNote && (
            <textarea
              value={orderNote}
              onChange={event => onOrderNoteChange(event.target.value.slice(0, 240))}
              maxLength={240}
              rows={3}
              placeholder="Add dietary tweaks, arrival notes, or plate instructions (max 240 characters)."
              disabled={placingOrder || orderSuccess}
              className="mt-3 w-full rounded-lg border border-theme bg-theme-elevated px-4 py-3 text-sm text-[var(--text-main)] placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
        </div>

        {/* Marketing Opt-ins */}
        {enableMarketingOptins && (
          <div className="space-y-3 rounded-2xl border border-theme bg-theme-elevated px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-main)]/60">
              Stay in the loop
            </p>
            <label className="flex items-start gap-3 text-sm text-[var(--text-main)]/80">
              <input
                type="checkbox"
                checked={emailUpdatesOptIn}
                onChange={event => onEmailOptInChange(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-theme-medium bg-theme-elevated text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 min-h-[44px] min-w-[44px]"
              />
              <span>Email me about new menus, chef tastings, and loyalty rewards.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-[var(--text-main)]/80">
              <input
                type="checkbox"
                checked={smsUpdatesOptIn}
                onChange={event => onSmsOptInChange(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-theme-medium bg-theme-elevated text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 min-h-[44px] min-w-[44px]"
              />
              <span>Text me order updates and flash deals (standard rates apply).</span>
            </label>
          </div>
        )}

        {/* Back to Saved Addresses Button */}
        {user && useManualAddress && savedAddressesCount > 0 && onBackToSavedAddresses && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={onBackToSavedAddresses}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--text-main)] bg-theme-elevated border border-theme rounded-lg transition cursor-pointer min-h-[44px]"
              style={{
                backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'rgba(0, 0, 0, 0.08)'
                  : 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isLightTheme ? 'rgba(0, 0, 0, 0.04)' : ''
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Saved Addresses
            </button>
          </div>
        )}

        {/* Place Order / Continue to Payment Button */}
        {!showPayment && (
          <div className="pt-6 border-t border-theme mt-6">
            <button
              type="submit"
              disabled={placingOrder || orderSuccess || !isAddressValid()}
              className="w-full bg-gradient-to-r from-accent to-accent/80 text-black py-3.5 rounded-lg font-semibold text-base hover:from-accent/90 hover:to-accent/70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {placingOrder ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : orderSuccess ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Order Placed!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                  Continue to Payment
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
