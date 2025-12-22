/**
 * Type declarations for discount utilities
 */
export interface DiscountValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
  discount?: {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    expires_at?: string;
  };
}

export interface DiscountApplicationResult {
  success: boolean;
  discountAmount?: number;
  finalTotal?: number;
  error?: string;
  message?: string;
}

export function validateDiscountCode(code: string, userId: string, orderTotal: number): Promise<DiscountValidationResult>;
export function applyDiscountCodeToOrder(orderId: string, code: string, userId: string): Promise<DiscountApplicationResult>;
export function calculateDiscountAmount(discount: DiscountValidationResult['discount'], orderTotal: number): number;

