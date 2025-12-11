import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Professional Custom Dropdown Component
 * Opens downward with scrolling for many items
 * Matches Dark Luxe theme
 */
const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  icon = null,
  className = ''
}) => {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
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

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the button AND the menu
      const isOutsideButton = dropdownRef.current && !dropdownRef.current.contains(event.target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);

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
    const handleEscape = (event) => {
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

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2
          px-4 py-2.5 rounded-lg border border-theme
          bg-theme-elevated text-sm text-[var(--text-main)]
          hover:border-[var(--accent)]/30
          focus:ring-2 focus:ring-[var(--accent)]/50
          focus:outline-none transition-all cursor-pointer
          ${isOpen ? 'ring-2 ring-[var(--accent)]/50 border-[var(--accent)]/30' : ''}
        `}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isLightTheme 
            ? 'rgba(0, 0, 0, 0.08)' 
            : 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
        }}
        onFocus={(e) => {
          e.currentTarget.style.backgroundColor = isLightTheme 
            ? 'rgba(0, 0, 0, 0.08)' 
            : 'rgba(255, 255, 255, 0.1)';
        }}
        onBlur={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '';
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          {icon && <span className="text-[var(--accent)]">{icon}</span>}
          <span className={selectedOption ? '' : 'text-muted'}>
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
          className="
            fixed
            bg-[var(--bg-main)] border border-theme rounded-lg
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
            borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined
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
              scrollbarColor: 'rgba(197, 157, 95, 0.3) rgba(255, 255, 255, 0.05)',
            }}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full text-left px-4 py-3 text-sm
                  transition-colors duration-150
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === options.length - 1 ? 'rounded-b-lg' : ''}
                  ${
                    option.value === value
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)] font-semibold'
                      : 'text-[var(--text-main)]'
                  }
                `}
                onMouseEnter={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.backgroundColor = isLightTheme 
                      ? 'rgba(0, 0, 0, 0.08)' 
                      : 'rgba(255, 255, 255, 0.1)';
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
              className="px-4 py-2 border-t border-theme rounded-b-lg"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(0, 0, 0, 0.04)' 
                  : 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <p className="text-xs text-muted text-center">
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
          background: rgba(197, 157, 95, 0.3);
          border-radius: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(197, 157, 95, 0.5);
        }
      `}</style>
    </div>
  );
};

CustomDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  placeholder: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default CustomDropdown;
