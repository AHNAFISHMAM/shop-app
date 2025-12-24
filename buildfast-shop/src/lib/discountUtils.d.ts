export interface DiscountValidationResult {
  valid: boolean
  discountCode?: {
    id: string
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    min_order_amount?: number
    max_discount_amount?: number
    [key: string]: unknown
  }
  discountAmount?: number
  finalTotal?: number
  error?: string
  message?: string
}

export interface DiscountCode {
  id: string
  code: string
  description?: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount?: number | null
  max_discount_amount?: number | null
  starts_at?: string | null
  expires_at?: string | null
  usage_limit?: number | null
  usage_count?: number
  one_per_customer?: boolean
  is_active?: boolean
  created_by?: string
  [key: string]: unknown
}

export function validateDiscountCode(
  code: string,
  userId: string,
  orderTotal: number
): Promise<DiscountValidationResult>
export function applyDiscountCodeToOrder(
  discountCodeId: string,
  userId: string,
  orderId: string,
  discountAmount: number,
  orderTotal: number
): Promise<{ success: boolean; error?: unknown; message?: string; errorType?: string }>
export function getAllDiscountCodes(): Promise<{
  success: boolean
  data?: DiscountCode[]
  error?: unknown
}>
export function createDiscountCode(
  codeData: Partial<DiscountCode>
): Promise<{ success: boolean; data?: DiscountCode; error?: unknown }>
export function updateDiscountCode(
  id: string,
  updates: Partial<DiscountCode>
): Promise<{ success: boolean; data?: DiscountCode; error?: unknown }>
export function deleteDiscountCode(id: string): Promise<{ success: boolean; error?: unknown }>
export function getDiscountCodeUsageStats(discountCodeId: string): Promise<{
  success: boolean
  data?: {
    usage_count: number
    total_revenue: number
    total_discount: number
    usage_history: unknown[]
  }
  error?: unknown
}>
export function formatDiscountDisplay(discountCode: DiscountCode | null): string
export function isDiscountCodeActive(discountCode: DiscountCode | null): boolean
