export interface Variant {
  id: string
  product_id: string
  variant_type: string
  variant_value: string
  price_adjustment?: number
  is_active: boolean
  [key: string]: unknown
}

export interface VariantResult {
  success: boolean
  data?: Variant[]
  error?: unknown
}

export function getProductVariants(productId: string): Promise<VariantResult>
export function getGroupedVariants(
  productId: string
): Promise<{ success: boolean; data?: Record<string, Variant[]>; error?: unknown }>
export function getVariantById(
  variantId: string
): Promise<{ success: boolean; data?: Variant; error?: unknown }>
export function calculateVariantPrice(
  basePrice: number | string,
  priceAdjustment: number | string
): number
export function createVariant(
  variantData: Partial<Variant>
): Promise<{ success: boolean; data?: Variant; error?: unknown }>
export function updateVariant(
  variantId: string,
  updates: Partial<Variant>
): Promise<{ success: boolean; data?: Variant; error?: unknown }>
export function deleteVariant(variantId: string): Promise<{ success: boolean; error?: unknown }>
export function productHasVariants(productId: string): Promise<boolean>
export function formatVariantDisplay(variantDetails: Variant | Variant[] | null): string
