import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}) {
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption: "relative mx-10 mb-4 flex h-10 items-center justify-center z-20",
    caption_label: "text-lg sm:text-xl font-semibold text-[var(--text-main)]",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 sm:size-10 text-[var(--text-muted)] hover:text-[var(--text-main)] p-0",
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 sm:size-10 text-[var(--text-muted)] hover:text-[var(--text-main)] p-0",
    ),
    table: "w-full border-collapse",
    head_row: "grid grid-cols-7 w-full mb-2 gap-0",
    head_cell: "w-full text-center text-xs sm:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider py-2 box-border",
    row: "grid grid-cols-7 w-full mt-1 gap-0",
    cell: "w-full relative text-center p-0 focus-within:relative focus-within:z-20 box-border",
    weekday: "w-full text-center text-xs sm:text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider py-2 box-border",
    day_button:
      "relative flex w-full h-full min-h-[40px] sm:min-h-[44px] md:min-h-[48px] items-center justify-center whitespace-nowrap rounded-lg p-0 text-sm sm:text-base font-semibold text-[var(--text-main)] outline-offset-2 group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 focus:outline-none group-data-[disabled]:pointer-events-none focus-visible:z-10 hover:bg-[rgba(255,255,255,0.08)] group-data-[selected]:bg-[var(--accent)] hover:text-[var(--text-main)] group-data-[selected]:text-black group-data-[disabled]:text-[var(--text-muted)]/30 group-data-[disabled]:line-through group-data-[outside]:text-[var(--text-muted)]/30 group-data-[outside]:group-data-[selected]:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]/70 group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-data-[selected]:group-[.range-middle]:bg-[var(--accent)]/20 group-data-[selected]:group-[.range-middle]:text-[var(--text-main)]",
    day: "group w-full h-full min-h-[40px] sm:min-h-[44px] md:min-h-[48px] px-0 text-sm sm:text-base",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-[var(--accent)] [&[data-selected]:not(.range-middle)>*]:after:bg-[var(--bg-main)] [&[data-disabled]>*]:after:bg-[var(--text-muted)]/30 *:after:transition-colors border-2 border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] font-bold",
    outside: "text-[var(--text-muted)] data-selected:bg-[var(--accent)]/50 data-selected:text-[var(--text-muted)]",
    hidden: "invisible",
    week_number: "size-9 p-0 text-xs font-medium text-[var(--text-muted)]",
  }

  const mergedClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key]
        ? cn(
            defaultClassNames[key],
            classNames[key],
          )
        : defaultClassNames[key],
    }),
    {},
  )

  const defaultComponents = {
    Chevron: (props) => {
      if (props.orientation === "left") {
        return <ChevronLeft size={16} strokeWidth={2} {...props} aria-hidden="true" />
      }
      return <ChevronRight size={16} strokeWidth={2} {...props} aria-hidden="true" />
    },
  }

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

