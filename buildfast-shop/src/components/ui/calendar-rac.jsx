import React from "react"
import { cn } from "../../lib/utils"
import { getLocalTimeZone, today } from "@internationalized/date"
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
} from "react-aria-components"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"

const CalendarHeader = () => (
  <header className="flex w-full items-center justify-between gap-2 pb-4 mb-4">
    <Button
      slot="previous"
      className="flex size-9 sm:size-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition-all hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2"
      aria-label="Previous month"
    >
      <ChevronLeftIcon className="size-4" aria-hidden="true" />
    </Button>
    <HeadingRac className="flex-1 text-center text-base sm:text-lg font-semibold text-[var(--text-main)]" />
    <Button
      slot="next"
      className="flex size-9 sm:size-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition-all hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2"
      aria-label="Next month"
    >
      <ChevronRightIcon className="size-4" aria-hidden="true" />
    </Button>
  </header>
)

const CalendarGridComponent = ({ isRange = false }) => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac className="w-full">
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className="size-9 sm:size-10 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-2">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac>
        {(date) => {
          const isToday = date.compare(now) === 0
          return (
            <CalendarCellRac
              date={date}
              className={cn(
                "relative flex size-9 sm:size-10 items-center justify-center rounded-lg text-sm font-medium transition-all",
                "text-[var(--text-main)]",
                "hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-1 focus:z-10",
                "data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed data-[disabled]:line-through",
                "data-[selected]:bg-[var(--accent)] data-[selected]:text-white data-[selected]:font-semibold data-[selected]:shadow-sm",
                isToday && !isRange && "ring-2 ring-[var(--accent)] ring-offset-1",
                isRange && "data-[selection-start]:rounded-r-none data-[selection-end]:rounded-l-none data-[selected]:data-[selection-middle]:rounded-none"
              )}
            />
          )
        }}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

export const Calendar = ({ className, ...props }) => {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn(
          "w-full max-w-sm mx-auto flex flex-col p-4 sm:p-6",
          "bg-[var(--bg-main)] rounded-xl border border-theme",
          className
        ),
      )}
    >
      <CalendarHeader />
      <div className="w-full">
        <CalendarGridComponent />
      </div>
    </CalendarRac>
  )
}

export const RangeCalendar = ({ className, ...props }) => {
  return (
    <RangeCalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn(
          "w-full max-w-sm mx-auto flex flex-col p-4 sm:p-6",
          "bg-[var(--bg-main)] rounded-xl border border-theme",
          className
        ),
      )}
    >
      <CalendarHeader />
      <div className="w-full">
        <CalendarGridComponent isRange />
      </div>
    </RangeCalendarRac>
  )
}


