export interface VariantResult {
    success: boolean;
    data?: any;
    error?: any;
}

export declare function getProductVariants(productId: string): Promise<VariantResult>;
export declare function getGroupedVariants(productId: string): Promise<VariantResult>;
export declare function getVariantById(variantId: string): Promise<VariantResult>;
export declare function createVariant(variantData: any): Promise<VariantResult>;
export declare function updateVariant(variantId: string, updates: any): Promise<VariantResult>;
export declare function deleteVariant(variantId: string): Promise<VariantResult>;

