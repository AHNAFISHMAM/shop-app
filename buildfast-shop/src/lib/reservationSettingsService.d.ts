export interface ReservationSettings {
  [key: string]: unknown
}

export function getReservationSettings(): Promise<{
  success: boolean
  data: ReservationSettings | null
  error: string | null
}>
export function updateReservationSettings(updates: Record<string, unknown>): Promise<{
  success: boolean
  data: ReservationSettings | null
  error: string | null
}>
export function generateTimeSlotsFromSettings(settings: ReservationSettings | null): string[]
export function isDateBlocked(date: Date | string, blockedDates?: string[]): boolean
export function isDayOperating(date: Date | string, operatingDays?: number[]): boolean
export function getMinBookingDate(allowSameDayBooking?: boolean): Date
export function getMaxBookingDate(advanceBookingDays?: number): Date
