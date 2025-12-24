import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { DayPicker, type DayPickerProps } from 'react-day-picker'
import { cn } from '../../lib/utils'
import { buttonVariants } from './button'

/**
 * Calendar Component
 *
 * A fully accessible calendar component built on react-day-picker with proper
 * keyboard navigation, WCAG 2.2 AA compliance, and 44px minimum touch targets.
 * Uses design system CSS variables for consistent theming.
 *
 * @example
 * ```tsx
 * <Calendar
 *   mode="single"
 *   selected={selectedDate}
 *   onSelect={setSelectedDate}
 *   className="rounded-lg border"
 * />
 * ```
 */
export interface CalendarProps extends Omit<DayPickerProps, 'classNames' | 'components'> {
  /**
   * Additional CSS classes for the calendar container
   */
  className?: string
  /**
   * Custom class names for calendar elements
   */
  classNames?: Partial<Record<string, string>>
  /**
   * Show days from previous/next month
   */
  showOutsideDays?: boolean
  /**
   * Custom components for calendar elements
   */
  components?: DayPickerProps['components']
}

// Extract constants outside component (performance best practice)
const DEFAULT_CLASS_NAMES = {
  months: 'relative flex flex-col sm:flex-row gap-4',
  month: 'w-full',
  month_caption: 'relative mx-10 mb-4 flex h-10 items-center justify-center z-20',
  caption_label: 'text-lg sm:text-xl font-semibold text-[var(--text-primary)]',
  nav: 'absolute top-0 flex w-full justify-between z-10',
  button_previous: cn(
    buttonVariants({ variant: 'ghost' }),
    'min-h-[44px] min-w-[44px] h-11 w-11 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0'
  ),
  button_next: cn(
    buttonVariants({ variant: 'ghost' }),
    'min-h-[44px] min-w-[44px] h-11 w-11 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0'
  ),
  table: 'w-full border-collapse',
  head_row: 'grid grid-cols-7 w-full mb-2 gap-0',
  head_cell:
    'w-full text-center text-xs sm:text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider py-2 box-border',
  row: 'grid grid-cols-7 w-full mt-1 gap-0',
  cell: 'w-full relative text-center p-0 focus-within:relative focus-within:z-20 box-border',
  weekday:
    'w-full text-center text-xs sm:text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider py-2 box-border',
  day_button:
    'relative flex w-full h-full min-h-[44px] items-center justify-center whitespace-nowrap rounded-lg p-0 text-sm sm:text-base font-semibold text-[var(--text-primary)] outline-offset-2 group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 focus:outline-none group-data-[disabled]:pointer-events-none focus-visible:z-10 hover:bg-[var(--bg-hover)] group-data-[selected]:bg-[var(--accent)] hover:text-[var(--text-primary)] group-data-[selected]:text-black group-data-[disabled]:text-[var(--text-secondary)]/30 group-data-[disabled]:line-through group-data-[outside]:text-[var(--text-secondary)]/30 group-data-[outside]:group-data-[selected]:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]/70 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-data-[selected]:group-[.range-middle]:bg-[var(--accent)]/20 group-data-[selected]:group-[.range-middle]:text-[var(--text-primary)]',
  day: 'group w-full h-full min-h-[44px] px-0 text-sm sm:text-base',
  range_start: 'range-start',
  range_end: 'range-end',
  range_middle: 'range-middle',
  today:
    '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-[var(--accent)] [&[data-selected]:not(.range-middle)>*]:after:bg-[var(--bg-main)] [&[data-disabled]>*]:after:bg-[var(--text-secondary)]/30 *:after:transition-colors border-2 border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] font-bold',
  outside:
    'text-[var(--text-secondary)] data-selected:bg-[var(--accent)]/50 data-selected:text-[var(--text-secondary)]',
  hidden: 'invisible',
  week_number:
    'min-h-[44px] min-w-[44px] h-11 w-11 p-0 text-xs font-medium text-[var(--text-secondary)]',
} as const

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const mergedClassNames = React.useMemo(() => {
    return Object.keys(DEFAULT_CLASS_NAMES).reduce(
      (acc, key) => {
        const defaultClassName = DEFAULT_CLASS_NAMES[key as keyof typeof DEFAULT_CLASS_NAMES]
        const customClassName = classNames?.[key as keyof typeof classNames]
        return {
          ...acc,
          [key]: customClassName ? cn(defaultClassName, customClassName) : defaultClassName,
        }
      },
      {} as Record<string, string>
    )
  }, [classNames])

  const defaultComponents = React.useMemo(
    () => ({
      Chevron: (chevronProps: { orientation?: 'left' | 'right' } & React.ComponentProps<'svg'>) => {
        if (chevronProps.orientation === 'left') {
          return <ChevronLeft size={16} strokeWidth={2} {...chevronProps} aria-hidden="true" />
        }
        return <ChevronRight size={16} strokeWidth={2} {...chevronProps} aria-hidden="true" />
      },
    }),
    []
  )

  const mergedComponents = React.useMemo(
    () => ({
      ...defaultComponents,
      ...(userComponents || {}),
    }) as DayPickerProps['components'],
    [defaultComponents, userComponents]
  )

  return (
    <DayPicker
      {...(props as DayPickerProps)}
      showOutsideDays={showOutsideDays}
      className={cn('w-fit', className)}
      classNames={mergedClassNames}
      components={mergedComponents as DayPickerProps['components']}
    />
  )
}

Calendar.displayName = 'Calendar'
