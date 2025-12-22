/**
 * AddressCard Component
 *
 * Displays a single shipping address in card format with actions.
 * Memoized to prevent unnecessary re-renders in address lists.
 */
import { memo, useState, useEffect, MouseEvent, HTMLAttributes } from 'react'
import { Address } from './AddressForm'

/**
 * AddressCardProps interface
 */
export interface AddressCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (address: Address) => void
  onSetDefault: (address: Address) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (address: Address) => void
}

const AddressCard = memo(function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  selectable = false,
  selected = false,
  onSelect,
  ...rest
}: AddressCardProps) {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(address)
    }
  }

  const getShadowStyle = (): string => {
    if (selectable && selected) {
      return isLightTheme 
        ? '0 16px 45px rgba(var(--accent-rgb), 0.25), 0 0 0 1px rgba(var(--accent-rgb), 0.3)' 
        : '0 16px 45px rgba(var(--accent-rgb), 0.35)';
    }
    if (selectable) {
      return isLightTheme 
        ? '0 16px 45px rgba(0, 0, 0, 0.2)' 
        : '0 16px 45px rgba(0, 0, 0, 0.45)';
    }
    return isLightTheme 
      ? '0 14px 40px rgba(0, 0, 0, 0.15)' 
      : '0 14px 40px rgba(0, 0, 0, 0.35)';
  };

  return (
    <div
      className={`relative card-soft p-6 transition-all ${
        selectable
          ? selected
            ? 'border-[var(--accent)] cursor-pointer'
            : 'hover:border-[var(--accent)]/40 cursor-pointer'
          : 'hover:border-[var(--accent)]/30'
      }`}
      style={{
        boxShadow: getShadowStyle()
      }}
      onClick={handleClick}
      role={selectable ? 'button' : undefined}
      aria-label={selectable ? `Select address: ${address.label}` : `Address: ${address.label}`}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={(e) => {
        if (selectable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      {...rest}
    >
      {/* Header with Label and Default Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Label Badge */}
          <span 
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold tracking-wide uppercase ${
              address.label === 'Home' ? 'bg-[var(--status-success-bg)] text-[var(--color-emerald)]' :
              address.label === 'Work' ? 'bg-[rgba(var(--color-blue-rgb),0.1)] text-[var(--color-blue)]' :
              address.label === 'Office' ? 'bg-[rgba(var(--color-purple-rgb),0.1)] text-[var(--color-purple)]' :
              'text-[var(--text-main)]/70'
            }`}
            style={
              address.label !== 'Home' && address.label !== 'Work' && address.label !== 'Office'
                ? {
                    backgroundColor: isLightTheme
                      ? 'rgba(var(--bg-dark-rgb), 0.08)'
                      : 'rgba(var(--text-main-rgb), 0.1)'
                  }
                : undefined
            }
            aria-label={`Address label: ${address.label}`}
          >
            {address.label === 'Home' && (
            <svg className="w-4 h-4 mr-1 text-[var(--color-emerald)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
            {address.label === 'Work' && (
            <svg className="w-4 h-4 mr-1 text-[var(--color-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            {address.label === 'Office' && (
            <svg className="w-4 h-4 mr-1 text-[var(--color-purple)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
            {address.label}
          </span>

          {/* Default Badge */}
          {address.isDefault && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold tracking-wide bg-gradient-to-r from-[var(--color-amber)]/90 to-[var(--color-orange)]/90 text-black shadow-sm" aria-label="Default address">
              <svg className="w-3 h-3 mr-1 text-black" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              DEFAULT
            </span>
          )}
        </div>

        {/* Selection Indicator for Checkout */}
        {selectable && selected && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_rgba(var(--accent-rgb),0.3)]" aria-label="Selected address">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Address Details */}
      <div className="space-y-2 mb-4" role="group" aria-label="Address details">
        <p className="font-semibold text-[var(--text-main)] text-lg">{address.fullName}</p>
        <p className="text-[var(--text-main)]/70">{address.addressLine1}</p>
        {address.addressLine2 && (
          <p className="text-[var(--text-main)]/70">{address.addressLine2}</p>
        )}
        <p className="text-[var(--text-main)]/70">
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p className="text-[var(--text-main)]/70">{address.country}</p>
        {address.phone && (
          <p className="text-[var(--text-main)]/60 text-sm flex items-center gap-1 mt-2">
            <svg className="w-4 h-4 text-[var(--text-main)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {address.phone}
          </p>
        )}
      </div>

      {/* Action Buttons - Only show if not in selectable mode */}
      {!selectable && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-default)]" role="group" aria-label="Address actions">
          {/* Edit Button */}
          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              onEdit(address)
            }}
            className="flex items-center gap-1 min-h-[44px] px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-[var(--text-main)] border border-[var(--border-default)] bg-[var(--bg-elevated)] rounded-full transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = isLightTheme 
                  ? 'rgba(var(--bg-dark-rgb), 0.08)' 
                  : 'rgba(var(--text-main-rgb), 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
            }}
            aria-label={`Edit ${address.label} address`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>

          {/* Set as Default Button */}
          {!address.isDefault && (
            <button
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                onSetDefault(address)
              }}
              className="flex items-center gap-1 min-h-[44px] px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-[var(--color-amber)] border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 hover:bg-[var(--color-amber)]/20 rounded-full transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label={`Set ${address.label} as default address`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Set as Default
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              onDelete(address)
            }}
            className="flex items-center gap-1 min-h-[44px] px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-[var(--color-rose)] border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/10 hover:bg-[var(--color-rose)]/20 rounded-full transition cursor-pointer ml-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            aria-label={`Delete ${address.label} address`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
})

export default AddressCard

