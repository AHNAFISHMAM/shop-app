import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';

/**
 * CustomDropdown - A reusable dropdown component matching the app's design system
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string|number} props.value - Current selected value
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional classes for the button
 * @param {boolean} props.disabled - Whether dropdown is disabled
 * @param {string} props.id - ID for the dropdown
 * @param {string} props.name - Name attribute
 * @param {boolean} props.required - Whether field is required
 * @param {number} props.maxVisibleItems - Max items visible before scrolling (default: 5)
 */
export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  id,
  name,
  required = false,
  maxVisibleItems = 5
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside (simplified - backdrop handles its own clicks)
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      // Don't close if clicking inside the dropdown container
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      
      // Don't close if clicking on the dropdown menu itself (portal)
      const dropdownMenu = document.querySelector('[data-dropdown-menu]');
      if (dropdownMenu && dropdownMenu.contains(event.target)) {
        return;
      }
      
      // Close if clicking outside
      setIsOpen(false);
    }

    // Use capture phase and delay to ensure option clicks process first
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  const itemHeight = 40;
  const maxHeight = (itemHeight * maxVisibleItems) + 16;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        id={id}
        name={name}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-5 py-3.5 sm:py-4 h-[52px] bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(197,157,95,0.2)] hover:border-[rgba(197,157,95,0.5)] focus:border-[rgba(197,157,95,0.8)] focus:outline-none rounded-lg text-sm sm:text-base text-[var(--text-main)] transition-all duration-300 cursor-pointer backdrop-blur-sm flex items-center justify-between ${
          !selectedOption ? 'text-[var(--text-muted)]' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        aria-label={placeholder}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        <span>{displayText}</span>
        <svg 
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Portal */}
      {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <>
            {/* Backdrop Overlay */}
            <m.div
              data-dropdown-backdrop
              className="fixed inset-0 z-[99999] bg-black/30 backdrop-blur-sm"
              onClick={(e) => {
                // Only close if clicking directly on backdrop element itself
                const target = e.target;
                if (target && target === e.currentTarget) {
                  setIsOpen(false);
                }
              }}
              style={{ pointerEvents: 'auto' }}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Dropdown Menu */}
            {(() => {
              const buttonRect = dropdownRef.current?.querySelector('button')?.getBoundingClientRect();
              if (!buttonRect) return null;
              
              return (
                <m.div
                  data-dropdown-menu
                  className="fixed w-56 bg-[var(--bg-main)] border-2 border-[rgba(197,157,95,0.3)] rounded-xl shadow-2xl z-[100000] overflow-hidden"
                  style={{
                    top: `${buttonRect.bottom + 8}px`,
                    left: `${buttonRect.left}px`,
                    maxHeight: `${maxHeight}px`
                  }}
                  role="listbox"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Scrollable Container */}
                  <div 
                    className="overflow-y-auto max-h-full dropdown-scrollbar" 
                    style={{ maxHeight: `${maxHeight}px` }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="p-2">
                      {options.length > 0 ? (
                        options.map(option => {
                          const isSelected = value === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Call onChange first
                                if (onChange) {
                                  onChange({ target: { value: option.value, name } });
                                }
                                // Close dropdown immediately
                                setIsOpen(false);
                              }}
                              onMouseDown={(e) => {
                                // Prevent backdrop from closing
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1 last:mb-0 cursor-pointer ${
                                isSelected
                                  ? 'bg-[rgba(197,157,95,0.25)] text-[#C59D5F] font-semibold shadow-sm'
                                  : 'text-[var(--text-main)] hover:bg-[rgba(197,157,95,0.1)] hover:text-[rgba(197,157,95,0.9)]'
                              }`}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <span className="flex items-center justify-between">
                                <span>{option.label}</span>
                                {isSelected && (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-2.5 text-sm text-[var(--text-muted)]">
                          No options available
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Scroll Indicator */}
                  {options.length > maxVisibleItems && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent pointer-events-none flex flex-col items-center justify-end pb-2">
                      <span className="text-[10px] text-[rgba(197,157,95,0.7)] font-medium mb-1">Scroll for more</span>
                      <svg className="w-5 h-5 text-[rgba(197,157,95,0.8)] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </m.div>
              );
            })()}
          </>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

