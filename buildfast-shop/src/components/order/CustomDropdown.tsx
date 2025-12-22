import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * DropdownOption interface
 */
export interface DropdownOption {
  value: string | number;
  label: string;
}

/**
 * DropdownPosition interface
 */
interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * CustomDropdownProps interface
 */
export interface CustomDropdownProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  maxVisibleItems?: number;
}

/**
 * Professional Custom Dropdown Component
 * Opens downward with scrolling for many items
 * Matches Dark Luxe theme
 *
 * @param {CustomDropdownProps} props - Component props
 */
const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  icon = null,
  className = '',
  id,
  name,
  disabled = false,
  required = false,
  maxVisibleItems,
}: CustomDropdownProps) => {
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

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the button AND the menu
      const target = event.target as Node;
      const isOutsideButton = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);

      if (isOutsideButton && isOutsideMenu) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Update dropdown position when opened or on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (dropdownRef.current && isOpen) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const visibleOptions = maxVisibleItems ? options.slice(0, maxVisibleItems) : options;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2 min-h-[44px]
          px-4 py-2.5 rounded-lg border border-[var(--border-default)]
          bg-[var(--bg-elevated)] text-sm text-[var(--text-main)]
          hover:border-[var(--accent)]/30
          focus:ring-2 focus:ring-[var(--accent)]/50
          focus:outline-none transition-all cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-[var(--accent)]/50 border-[var(--accent)]/30' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${id || 'dropdown'}-menu` : undefined}
        aria-required={required}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = isLightTheme 
              ? 'rgba(var(--bg-dark-rgb), 0.08)' 
              : 'rgba(var(--text-main-rgb), 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = isLightTheme 
              ? 'rgba(var(--bg-dark-rgb), 0.08)' 
              : 'rgba(var(--text-main-rgb), 0.1)';
          }
        }}
        onBlur={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '';
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          {icon && <span className="text-[var(--accent)]" aria-hidden="true">{icon}</span>}
          <span className={selectedOption ? '' : 'text-[var(--text-muted)]'}>
            {displayText}
          </span>
        </div>

        <svg
          className={`w-4 h-4 text-[var(--accent)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu - Rendered via Portal at body level */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          id={`${id || 'dropdown'}-menu`}
          role="listbox"
          aria-label="Dropdown options"
          className="
            fixed
            bg-[var(--bg-main)] border border-[var(--border-default)] rounded-lg
            animate-fade-in origin-top
          "
          style={{
            animation: 'slideDown 0.2s ease-out',
            zIndex: 9999,
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            boxShadow: isLightTheme 
              ? '0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
              : '0 10px 40px rgba(0, 0, 0, 0.5)',
            borderColor: isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.15)' : undefined
          }}
        >
          {/* Scrollable Options Container */}
          <div
            data-overlay-scroll
            className="
              max-h-[300px] overflow-y-auto
              scrollbar-thin scrollbar-thumb-[var(--accent)]/30
              scrollbar-track-white/5
            "
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(var(--accent-rgb), 0.3) rgba(255, 255, 255, 0.05)',
            }}
          >
            {visibleOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full text-left px-4 py-3 min-h-[44px] text-sm
                  transition-colors duration-150
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === visibleOptions.length - 1 ? 'rounded-b-lg' : ''}
                  ${
                    option.value === value
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)] font-semibold'
                      : 'text-[var(--text-main)]'
                  }
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]
                `}
                onMouseEnter={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.backgroundColor = isLightTheme 
                      ? 'rgba(var(--bg-dark-rgb), 0.08)' 
                      : 'rgba(var(--text-main-rgb), 0.1)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '';
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {option.value === value && (
                    <svg
                      className="w-4 h-4 text-[var(--accent)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Items Count Footer (if many items) */}
          {options.length > 10 && (
            <div 
              className="px-4 py-2 border-t border-[var(--border-default)] rounded-b-lg"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(var(--bg-dark-rgb), 0.04)' 
                  : 'rgba(var(--text-main-rgb), 0.02)'
              }}
            >
              <p className="text-sm text-[var(--text-muted)] text-center">
                {options.length} total options
              </p>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* CSS for smooth slide down animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom Scrollbar Styles (for Webkit browsers) */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(var(--accent-rgb), 0.3);
          border-radius: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--accent-rgb), 0.5);
        }
      `}</style>
    </div>
  );
};

export default CustomDropdown;

