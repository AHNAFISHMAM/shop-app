/**
 * SavedAddressDisplay Component
 *
 * Displays a saved address with options to change or manage addresses.
 */

import { Link } from 'react-router-dom'

interface SavedAddress {
  id: string
  fullName: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string | null
  isDefault?: boolean
}

interface SavedAddressDisplayProps {
  address: SavedAddress
  isLightTheme: boolean
  onUseManualAddress: () => void
}

export function SavedAddressDisplay({
  address,
  isLightTheme,
  onUseManualAddress,
}: SavedAddressDisplayProps) {
  return (
    <div
      className="border-2 border-accent/30 rounded-xl p-6 mb-6"
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-accent rounded-full">
            <svg
              className="w-6 h-6 text-[var(--text-main)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">Shipping To</h2>
            <p className="text-sm text-muted">Ready to ship to your default address</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {address.isDefault && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-sm">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              DEFAULT
            </span>
          )}
        </div>
      </div>

      {/* Address Display */}
      <div className="glow-surface glow-soft bg-theme-elevated border border-theme rounded-xl p-5 mb-4">
        <div className="space-y-2">
          <p className="font-bold text-[var(--text-main)] text-lg">{address.fullName}</p>
          <p className="text-muted">{address.addressLine1}</p>
          {address.addressLine2 && <p className="text-muted">{address.addressLine2}</p>}
          <p className="text-muted">
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p className="text-muted">{address.country}</p>
          {address.phone && (
            <p className="text-muted text-sm flex items-center gap-1 mt-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {address.phone}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUseManualAddress}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-accent border border-theme rounded-lg transition cursor-pointer min-h-[44px]"
          style={{
            backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = isLightTheme
              ? 'var(--bg-hover)'
              : 'rgba(255, 255, 255, 0.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = isLightTheme
              ? 'rgba(0, 0, 0, 0.04)'
              : 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Change Address
        </button>
        <Link
          to="/addresses"
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--text-main)] bg-theme-elevated border border-theme rounded-lg transition min-h-[44px]"
          style={{
            backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.04)' : undefined,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = isLightTheme
              ? 'var(--bg-hover)'
              : 'rgba(255, 255, 255, 0.08)'
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Manage Addresses
        </Link>
      </div>
    </div>
  )
}
