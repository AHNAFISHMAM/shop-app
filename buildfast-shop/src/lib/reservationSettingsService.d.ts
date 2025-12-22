export interface ReservationSettings {
    id: string;
    is_enabled: boolean;
    min_party_size: number;
    max_party_size: number;
    min_advance_booking_hours: number;
    max_advance_booking_days: number;
    available_days: string[];
    opening_time: string;
    closing_time: string;
    slot_duration_minutes: number;
    buffer_time_minutes: number;
    max_concurrent_reservations: number;
    require_approval: boolean;
    auto_confirm_threshold: number;
    email_notifications_enabled: boolean;
    sms_notifications_enabled: boolean;
    custom_message: string | null;
    created_at: string;
    updated_at: string;
}
export declare function getReservationSettings(): Promise<{
    success: boolean;
    data: ReservationSettings | null;
    error: string | null;
}>;
export declare function updateReservationSettings(settings: Partial<ReservationSettings>): Promise<{
    success: boolean;
    data: ReservationSettings | null;
    error: string | null;
}>;
export declare function generateTimeSlotsFromSettings(settings: ReservationSettings): string[];
export declare function isDateBlocked(date: Date | string, blockedDates?: string[]): boolean;
export declare function isDayOperating(date: Date | string, operatingDays?: number[]): boolean;
export declare function getMinBookingDate(allowSameDayBooking?: boolean): Date;
export declare function getMaxBookingDate(advanceBookingDays?: number): Date;
