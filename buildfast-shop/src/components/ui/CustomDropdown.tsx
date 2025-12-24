import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import * as React from 'react'

/**
 * CustomDropdown Component
 *
 * A fully accessible, mobile-first dropdown component with keyboard navigation,
 * proper ARIA attributes, and WCAG 2.2 AA compliance. Supports 44px minimum
 * touch targets and uses design system CSS variables.
 *
 * @example
 * ```tsx
 * <CustomDropdown
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' }
 *   ]}
 *   value={selectedValue}
 *   onChange={(e) => setSelectedValue(e.target.value)}
 *   placeholder="Select an option"
 * />
 * ```
 */
export interface DropdownOption {
  value: string | number
  label: string
}

export interface CustomDropdownProps {
  /**
   * Array of option objects with value and label
   */
  options?: DropdownOption[]
  /**
   * Current selected value
   */
  value?: string | number
  /**
   * Callback when selection changes. Receives event object with target.value and target.name
   */
  onChange?: (event: { target: { value: string | number; name?: string } }) => void
  /**
   * Placeholder text when no option is selected
   */
  placeholder?: string
  /**
   * Additional CSS classes for the button
   */
  className?: string
  /**
   * Whether dropdown is disabled
   */
  disabled?: boolean
  /**
   * HTML id attribute
   */
  id?: string
  /**
   * HTML name attribute
   */
  name?: string
  /**
   * Whether field is required
   */
  required?: boolean
  /**
   * Maximum number of items visible before scrolling (default: 5)
   */
  maxVisibleItems?: number
}

// Extract constants outside component (performance best practice)
const ITEM_HEIGHT = 44 // WCAG 2.2 minimum touch target
// const ITEM_PADDING = 12; // py-3 = 12px top + 12px bottom = 24px, plus content = ~44px

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  id,
  name,
  required = false,
  maxVisibleItems = 5,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  const selectedOption = options.find(opt => opt.value === value)
  const displayText = selectedOption ? selectedOption.label : placeholder
  const maxHeight = ITEM_HEIGHT * maxVisibleItems + 16

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      // Don't close if clicking inside the dropdown container
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return
      }

      // Don't close if clicking on the dropdown menu itself (portal)
      const dropdownMenu = document.querySelector('[data-dropdown-menu]')
      if (dropdownMenu && dropdownMenu.contains(target)) {
        return
      }

      // Close if clicking outside
      setIsOpen(false)
      setFocusedIndex(-1)
    }

    // Use capture phase and delay to ensure option clicks process first
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setFocusedIndex(-1)
          buttonRef.current?.focus()
          break

        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            const next = prev < options.length - 1 ? prev + 1 : 0
            optionRefs.current[next]?.scrollIntoView({ block: 'nearest' })
            return next
          })
          break

        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => {
            const next = prev > 0 ? prev - 1 : options.length - 1
            optionRefs.current[next]?.scrollIntoView({ block: 'nearest' })
            return next
          })
          break

        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            event.preventDefault()
            const option = options[focusedIndex]
            if (option && onChange) {
              onChange({ target: { value: option.value, name } })
            }
            setIsOpen(false)
            setFocusedIndex(-1)
            buttonRef.current?.focus()
          }
          break

        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          optionRefs.current[0]?.scrollIntoView({ block: 'nearest' })
          break

        case 'End': {
          event.preventDefault()
          const lastIndex = options.length - 1
          setFocusedIndex(lastIndex)
          optionRefs.current[lastIndex]?.scrollIntoView({ block: 'nearest' })
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, options, onChange, name])

  // Reset focused index when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = options.findIndex(opt => opt.value === value)
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
  }, [isOpen, options, value])

  // Focus management - scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [isOpen, focusedIndex])

  const handleOptionClick = useCallback(
    (option: DropdownOption) => {
      if (onChange) {
        onChange({ target: { value: option.value, name } })
      }
      setIsOpen(false)
      setFocusedIndex(-1)
      buttonRef.current?.focus()
    },
    [onChange, name]
  )

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev)
    }
  }, [disabled])

  // Generate unique ID if not provided - always call hook
  const generatedId = React.useId()
  const dropdownId = id || generatedId
  const listboxId = `${dropdownId}-listbox`

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        id={dropdownId}
        name={name}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full min-h-[44px] h-11 px-4 py-2.5',
          'bg-[var(--bg-elevated)]',
          'border-2 border-[var(--border-default)]',
          'hover:border-[var(--accent)]/50',
          'focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]',
          'rounded-lg text-sm sm:text-base',
          'text-[var(--text-primary)]',
          'transition-all duration-300',
          'cursor-pointer backdrop-blur-sm',
          'flex items-center justify-between',
          !selectedOption && 'text-[var(--text-secondary)]',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        aria-label={placeholder}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
        aria-controls={isOpen ? listboxId : undefined}
      >
        <span>{displayText}</span>
        <svg
          className={cn(
            'w-5 h-5 transition-transform duration-300 shrink-0',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Portal */}
      {isOpen &&
        !disabled &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            <>
              {/* Backdrop Overlay */}
              <m.div
                data-dropdown-backdrop
                className="fixed inset-0 z-[99999] backdrop-blur-sm"
                onClick={e => {
                  const target = e.target
                  if (target && target === e.currentTarget) {
                    setIsOpen(false)
                    setFocusedIndex(-1)
                  }
                }}
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: 'var(--modal-backdrop)',
                }}
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />

              {/* Dropdown Menu */}
              {(() => {
                const buttonRect = buttonRef.current?.getBoundingClientRect()
                if (!buttonRect) return null

                return (
                  <m.div
                    ref={menuRef}
                    data-dropdown-menu
                    id={listboxId}
                    className="fixed w-56 bg-[var(--bg-main)] border-2 border-[var(--border-default)] rounded-xl shadow-2xl z-[100000] overflow-hidden"
                    style={{
                      top: `${buttonRect.bottom + 8}px`,
                      left: `${buttonRect.left}px`,
                      maxHeight: `${maxHeight}px`,
                    }}
                    role="listbox"
                    aria-label={placeholder}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Scrollable Container */}
                    <div
                      className="overflow-y-auto max-h-full dropdown-scrollbar"
                      style={{ maxHeight: `${maxHeight}px` }}
                      onClick={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                    >
                      <div className="p-2">
                        {options.length > 0 ? (
                          options.map((option, index) => {
                            const isSelected = value === option.value
                            const isFocused = focusedIndex === index

                            return (
                              <button
                                key={option.value}
                                ref={el => {
                                  optionRefs.current[index] = el
                                }}
                                type="button"
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleOptionClick(option)
                                }}
                                onMouseDown={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                onMouseEnter={() => setFocusedIndex(index)}
                                className={cn(
                                  'w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 mb-1 last:mb-0 cursor-pointer min-h-[44px] flex items-center',
                                  'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-1',
                                  isSelected
                                    ? 'bg-[var(--accent)]/25 text-[var(--accent)] font-semibold shadow-sm'
                                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]',
                                  isFocused && !isSelected && 'bg-[var(--bg-hover)]'
                                )}
                                role="option"
                                aria-selected={isSelected}
                                tabIndex={-1}
                              >
                                <span className="flex items-center justify-between w-full">
                                  <span>{option.label}</span>
                                  {isSelected && (
                                    <svg
                                      className="w-4 h-4 shrink-0"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      aria-hidden="true"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </span>
                              </button>
                            )
                          })
                        ) : (
                          <div className="px-4 py-3 text-sm text-[var(--text-secondary)] min-h-[44px] flex items-center">
                            No options available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scroll Indicator */}
                    {options.length > maxVisibleItems && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent pointer-events-none flex flex-col items-center justify-end pb-2">
                        <span className="text-[10px] text-[var(--accent)]/70 font-medium mb-1">
                          Scroll for more
                        </span>
                        <svg
                          className="w-5 h-5 text-[var(--accent)]/80 animate-bounce"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </m.div>
                )
              })()}
            </>
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

export default CustomDropdown
