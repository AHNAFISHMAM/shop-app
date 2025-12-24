/**
 * FulfillmentSection Component
 *
 * Allows users to choose delivery or pickup and select time slot.
 */

import CustomDropdown from '../../../components/ui/CustomDropdown'
import { SCHEDULED_SLOTS } from '../constants'
import type { FulfillmentMode, ScheduledSlot } from '../types'

interface FulfillmentSectionProps {
  fulfillmentMode: FulfillmentMode
  scheduledSlot: ScheduledSlot
  onFulfillmentChange: (mode: FulfillmentMode) => void
  onScheduledSlotChange: (slot: ScheduledSlot) => void
}

export function FulfillmentSection({
  fulfillmentMode,
  scheduledSlot,
  onFulfillmentChange,
  onScheduledSlotChange,
}: FulfillmentSectionProps) {
  return (
    <div className="glow-surface glow-strong bg-theme-elevated border border-theme rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--text-main)]">Fulfillment</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-muted">
          {fulfillmentMode === 'delivery' ? 'Delivery' : 'Pickup'}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onFulfillmentChange('delivery')}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition min-h-[44px] ${
            fulfillmentMode === 'delivery'
              ? 'border-accent bg-accent/20 text-[var(--text-main)] shadow-lg shadow-accent/20'
              : 'border-theme bg-theme-elevated text-muted hover:border-accent/30 hover:text-[var(--text-main)]'
          }`}
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => onFulfillmentChange('pickup')}
          className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition min-h-[44px] ${
            fulfillmentMode === 'pickup'
              ? 'border-accent bg-accent/20 text-[var(--text-main)] shadow-lg shadow-accent/20'
              : 'border-theme bg-theme-elevated text-muted hover:border-accent/30 hover:text-[var(--text-main)]'
          }`}
        >
          Pickup
        </button>
      </div>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="scheduledSlot"
            className="block text-sm font-medium text-[var(--text-main)] mb-2"
          >
            {fulfillmentMode === 'delivery' ? 'Delivery window' : 'Pickup window'}
          </label>
          <CustomDropdown
            id="scheduledSlot"
            name="scheduledSlot"
            options={SCHEDULED_SLOTS.map(slot => ({ value: slot.value, label: slot.label }))}
            value={scheduledSlot}
            onChange={event => onScheduledSlotChange(event.target.value as ScheduledSlot)}
            placeholder="Select time window"
            maxVisibleItems={5}
          />
        </div>
        <div className="rounded-xl border border-theme bg-theme-elevated p-4 text-sm text-muted">
          {fulfillmentMode === 'delivery' ? (
            <p className="leading-snug">
              Courier heads out once the kitchen marks your order ready. We&apos;ll text live
              tracking the moment it&apos;s on the road.
            </p>
          ) : (
            <p className="leading-snug">
              Collect from the host desk at 61 Orchard Street. We&apos;ll ping you when the order is
              plated and ready to hand off.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
