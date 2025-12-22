import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * QuantityStepper component props
 */
interface QuantityStepperProps {
  /** Current quantity value */
  value: number;
  /** Callback when quantity changes */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Whether the stepper is disabled */
  disabled?: boolean;
  /** Whether the stepper is in loading state */
  loading?: boolean;
  /** ARIA label for the quantity selector group */
  'aria-label'?: string;
}

/**
 * Enhanced Quantity Stepper Component
 *
 * Supports direct input, keyboard shortcuts, and visual feedback.
 * Allows users to adjust quantity using buttons or direct input.
 *
 * Features:
 * - Direct input editing
 * - Keyboard shortcuts (Arrow Up/Down, Enter, Escape)
 * - Loading state support
 * - Min/max value constraints
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 */
const QuantityStepper = ({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
}: QuantityStepperProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDecrease = useCallback(() => {
    if (disabled || loading || value <= min) return;
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
  }, [disabled, loading, value, min, onChange]);

  const handleIncrease = useCallback(() => {
    if (disabled || loading || value >= max) return;
    const newValue = Math.min(max, value + 1);
    onChange(newValue);
  }, [disabled, loading, value, max, onChange]);

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
    inputRef.current?.select();
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsEditing(false);
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < min) {
      onChange(min);
    } else if (numValue > max) {
      onChange(max);
    } else {
      onChange(numValue);
    }
  }, [inputValue, min, max, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(newValue);
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrease();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrease();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      e.currentTarget.blur();
    }
  }, [value, handleIncrease, handleDecrease]);

  const handleDecreaseKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDecrease();
    }
  }, [handleDecrease]);

  const handleIncreaseKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleIncrease();
    }
  }, [handleIncrease]);

  const isDecreaseDisabled = disabled || loading || value <= min;
  const isIncreaseDisabled = disabled || loading || value >= max;

  return (
    <div className="quantity-stepper-v2" role="group" aria-label={ariaLabel || 'Quantity selector'}>
      <button
        type="button"
        className="quantity-stepper-btn-v2 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        onClick={handleDecrease}
        onKeyDown={handleDecreaseKeyDown}
        disabled={isDecreaseDisabled}
        aria-label="Decrease quantity"
        aria-disabled={isDecreaseDisabled}
      >
        −
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className="quantity-input-v2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        value={isEditing ? inputValue : value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled || loading}
        aria-label="Quantity"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        readOnly={!isEditing}
      />
      <button
        type="button"
        className="quantity-stepper-btn-v2 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        onClick={handleIncrease}
        onKeyDown={handleIncreaseKeyDown}
        disabled={isIncreaseDisabled}
        aria-label="Increase quantity"
        aria-disabled={isIncreaseDisabled}
      >
        +
      </button>
      {loading && (
        <div
          className="quantity-stepper-loading"
          aria-hidden="true"
          role="status"
          aria-label="Updating quantity"
        >
          <div className="quantity-stepper-spinner" />
        </div>
      )}
    </div>
  );
};

export default QuantityStepper;

