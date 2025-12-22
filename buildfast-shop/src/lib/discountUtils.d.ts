interface DiscountCode {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
    discount_value: number;
    minimum_order_amount: number | null;
    usage_limit: number | null;
    usage_count: number;
    expires_at: string | null;
    is_active: boolean;
    one_per_customer: boolean;
}
export declare function validateDiscountCode(code: string, userId: string, orderTotal: number): Promise<{
    valid: boolean;
    error: string | null;
    message: string | null;
    discount?: DiscountCode;
    discountAmount?: number;
}>;
export declare function applyDiscountCodeToOrder(discountCodeId: string, userId: string, orderId: string): Promise<{
    success: boolean;
    error: string | null;
}>;
export declare function removeDiscountCodeFromOrder(discountCodeId: string, userId: string, orderId: string): Promise<{
    success: boolean;
    error: string | null;
}>;
export declare function calculateDiscountAmount(orderTotal: number, discount: DiscountCode): number;
export declare function getAllDiscountCodes(): Promise<{
    success: boolean;
    data: DiscountCode[] | null;
    error: string | null;
}>;
export declare function createDiscountCode(codeData: Partial<DiscountCode>): Promise<{
    success: boolean;
    data: DiscountCode | null;
    error: string | null;
}>;
export declare function updateDiscountCode(id: string, updates: Partial<DiscountCode>): Promise<{
    success: boolean;
    data: DiscountCode | null;
    error: string | null;
}>;
export declare function deleteDiscountCode(id: string): Promise<{
    success: boolean;
    error: string | null;
}>;
export declare function getDiscountCodeUsageStats(discountCodeId: string): Promise<{
    success: boolean;
    data: any | null;
    error: string | null;
}>;
export declare function formatDiscountDisplay(discountCode: DiscountCode): string;
export declare function isDiscountCodeActive(discountCode: DiscountCode): boolean;
