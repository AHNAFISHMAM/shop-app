/**
 * Type declarations for reservation settings service
 */
export interface ReservationSettings {
  id?: string;
  [key: string]: any;
}

export interface ServiceResult {
  success: boolean;
  data?: ReservationSettings | null;
  error?: string | null;
}

export function getReservationSettings(): Promise<ServiceResult>;
export function updateReservationSettings(settings: Partial<ReservationSettings>): Promise<ServiceResult>;

