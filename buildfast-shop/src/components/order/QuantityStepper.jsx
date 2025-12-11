import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Enhanced Quantity Stepper Component
 * Supports direct input, keyboard shortcuts, and visual feedback
 */
const QuantityStepper = ({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDecrease = () => {
    if (disabled || loading || value <= min) return;
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
  };

  const handleIncrease = () => {
    if (disabled || loading || value >= max) return;
    const newValue = Math.min(max, value + 1);
    onChange(newValue);
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    inputRef.current?.select();
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < min) {
      onChange(min);
    } else if (numValue > max) {
      onChange(max);
    } else {
      onChange(numValue);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(newValue);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrease();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrease();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      e.target.blur();
    }
  };

  const handleDecreaseKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDecrease();
    }
  };

  const handleIncreaseKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleIncrease();
    }
  };

  return (
    <div className="quantity-stepper-v2" role="group" aria-label={ariaLabel || 'Quantity selector'}>
      <button
        type="button"
        className="quantity-stepper-btn-v2"
        onClick={handleDecrease}
        onKeyDown={handleDecreaseKeyDown}
        disabled={disabled || loading || value <= min}
        aria-label="Decrease quantity"
        aria-disabled={disabled || loading || value <= min}
      >
        −
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className="quantity-input-v2"
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
        className="quantity-stepper-btn-v2"
        onClick={handleIncrease}
        onKeyDown={handleIncreaseKeyDown}
        disabled={disabled || loading || value >= max}
        aria-label="Increase quantity"
        aria-disabled={disabled || loading || value >= max}
      >
        +
      </button>
      {loading && (
        <div
          className="quantity-stepper-loading"
          aria-hidden="true"
        >
          <div className="quantity-stepper-spinner" />
        </div>
      )}
    </div>
  );
};

QuantityStepper.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  'aria-label': PropTypes.string,
};

export default QuantityStepper;

