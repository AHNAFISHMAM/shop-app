import React from 'react'
import { cn } from '../../lib/utils'
import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date'
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
  composeRenderProps,
  type CalendarProps as CalendarRacProps,
  type RangeCalendarProps as RangeCalendarRacProps,
} from 'react-aria-components'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'

/**
 * CalendarHeader Component
 *
 * Header with navigation buttons for calendar component
 */
const CalendarHeader: React.FC = () => (
  <header className="flex w-full items-center justify-between gap-2 pb-4 mb-4">
    <Button
      slot="previous"
      className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]"
      aria-label="Previous month"
    >
      <ChevronLeftIcon className="size-4" aria-hidden="true" />
    </Button>
    <HeadingRac className="flex-1 text-center text-base sm:text-lg font-semibold text-[var(--text-primary)]" />
    <Button
      slot="next"
      className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]"
      aria-label="Next month"
    >
      <ChevronRightIcon className="size-4" aria-hidden="true" />
    </Button>
  </header>
)

/**
 * CalendarGridComponent
 *
 * Grid component for calendar cells with proper touch targets
 */
interface CalendarGridComponentProps {
  /**
   * Whether this is a range calendar
   */
  isRange?: boolean
}

const CalendarGridComponent: React.FC<CalendarGridComponentProps> = ({ isRange = false }) => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac className="w-full">
      <CalendarGridHeaderRac>
        {(day: string) => (
          <CalendarHeaderCellRac className="min-h-[44px] min-w-[44px] h-11 w-11 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider pb-2">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac>
        {(date: CalendarDate) => {
          const isToday = date.compare(now) === 0
          return (
            <CalendarCellRac
              date={date}
              className={cn(
                'relative flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-lg text-sm font-medium transition-all',
                'text-[var(--text-primary)]',
                'hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-1 focus:ring-offset-[var(--bg-main)] focus:z-10',
                'data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed data-[disabled]:line-through',
                'data-[selected]:bg-[var(--accent)] data-[selected]:text-black data-[selected]:font-semibold data-[selected]:shadow-sm',
                isToday && !isRange && 'ring-2 ring-[var(--accent)] ring-offset-1',
                isRange &&
                  'data-[selection-start]:rounded-r-none data-[selection-end]:rounded-l-none data-[selected]:data-[selection-middle]:rounded-none'
              )}
            />
          )
        }}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

/**
 * Calendar Component (React Aria)
 *
 * A fully accessible calendar component built on react-aria-components with
 * proper keyboard navigation, WCAG 2.2 AA compliance, and 44px minimum touch targets.
 * Uses design system CSS variables for consistent theming.
 *
 * @example
 * ```tsx
 * <Calendar
 *   value={selectedDate}
 *   onChange={setSelectedDate}
 *   className="rounded-lg border"
 * />
 * ```
 */
export interface CalendarProps extends CalendarRacProps<CalendarDate> {
  /**
   * Additional CSS classes
   */
  className?: string
}

export const Calendar: React.FC<CalendarProps> = ({ className, ...props }) => {
  return (
    <CalendarRac<CalendarDate>
      {...props}
      className={composeRenderProps(className, className =>
        cn(
          'w-full max-w-sm mx-auto flex flex-col p-4 sm:p-6',
          'bg-[var(--bg-main)] rounded-xl border border-[var(--border-default)]',
          className
        )
      )}
    >
      <CalendarHeader />
      <div className="w-full">
        <CalendarGridComponent />
      </div>
    </CalendarRac>
  )
}

/**
 * RangeCalendar Component (React Aria)
 *
 * A fully accessible range calendar component built on react-aria-components with
 * proper keyboard navigation, WCAG 2.2 AA compliance, and 44px minimum touch targets.
 * Uses design system CSS variables for consistent theming.
 *
 * @example
 * ```tsx
 * <RangeCalendar
 *   value={dateRange}
 *   onChange={setDateRange}
 *   className="rounded-lg border"
 * />
 * ```
 */
export interface RangeCalendarProps extends RangeCalendarRacProps<CalendarDate> {
  /**
   * Additional CSS classes
   */
  className?: string
}

export const RangeCalendar: React.FC<RangeCalendarProps> = ({ className, ...props }) => {
  return (
    <RangeCalendarRac<CalendarDate>
      {...props}
      className={composeRenderProps(className, className =>
        cn(
          'w-full max-w-sm mx-auto flex flex-col p-4 sm:p-6',
          'bg-[var(--bg-main)] rounded-xl border border-[var(--border-default)]',
          className
        )
      )}
    >
      <CalendarHeader />
      <div className="w-full">
        <CalendarGridComponent isRange />
      </div>
    </RangeCalendarRac>
  )
}
