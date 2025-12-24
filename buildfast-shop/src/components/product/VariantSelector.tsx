import { memo, useCallback } from 'react'
import { m } from 'framer-motion'
import { fadeSlideUp } from '../animations/menuAnimations'

interface Variant {
  id: string
  variant_type: string
  variant_value: string
  price_modifier?: number
  stock_quantity?: number
  [key: string]: unknown
}

interface VariantSelectorProps {
  groupedVariants: Record<string, Variant[]>
  selectedVariants: Record<string, Variant | string>
  onVariantChange: (type: string, value: string) => void
  prefersReducedMotion: boolean
}

const VariantSelector = memo(
  ({
    groupedVariants,
    selectedVariants,
    onVariantChange,
    prefersReducedMotion,
  }: VariantSelectorProps) => {
    const handleVariantSelect = useCallback(
      (type: string, value: string) => {
        onVariantChange(type, value)
      },
      [onVariantChange]
    )

    if (!groupedVariants || Object.keys(groupedVariants).length === 0) {
      return null
    }

    return (
      <div className="space-y-4">
        {Object.entries(groupedVariants).map(([type, variants], index) => (
          <m.div
            key={type}
            variants={prefersReducedMotion ? {} : fadeSlideUp}
            initial={prefersReducedMotion ? false : 'hidden'}
            animate={prefersReducedMotion ? false : 'visible'}
            custom={index * 0.05}
          >
            <label
              htmlFor={`variant-${type}`}
              className="block text-sm font-medium text-[var(--text-main)] mb-2"
            >
              {type}
            </label>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-labelledby={`variant-${type}-label`}
            >
              {variants.map(variant => {
                const selected = selectedVariants[type]
                const isSelected =
                  typeof selected === 'object'
                    ? selected?.id === variant.id
                    : selected === variant.variant_value
                const isOutOfStock =
                  variant.stock_quantity !== undefined && variant.stock_quantity <= 0

                return (
                  <m.button
                    key={variant.id}
                    type="button"
                    id={`variant-${type}-${variant.variant_value}`}
                    onClick={() =>
                      !isOutOfStock && handleVariantSelect(type, variant.variant_value)
                    }
                    disabled={isOutOfStock}
                    className={`px-4 py-2 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-[var(--border-hover)]'
                    } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={isOutOfStock}
                    aria-label={`${type}: ${variant.variant_value}${variant.price_modifier ? ` (+${variant.price_modifier})` : ''}`}
                  >
                    {variant.variant_value}
                    {variant.price_modifier && variant.price_modifier !== 0 && (
                      <span className="ml-1 text-xs">
                        {variant.price_modifier > 0 ? '+' : ''}
                        {variant.price_modifier}
                      </span>
                    )}
                  </m.button>
                )
              })}
            </div>
          </m.div>
        ))}
      </div>
    )
  }
)

VariantSelector.displayName = 'VariantSelector'

export default VariantSelector
