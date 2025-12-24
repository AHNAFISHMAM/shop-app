export interface VariantCombination {
  id: string;
  product_id: string;
  variant_values: Record<string, string>;
  price: number;
  stock_quantity?: number;
  is_active: boolean;
  [key: string]: unknown;
}

export interface CombinationResult {
  success: boolean;
  data?: VariantCombination[];
  error?: unknown;
}

export function getProductCombinations(productId: string): Promise<CombinationResult>;
export function findCombinationByValues(productId: string, variantValues: Record<string, string>): Promise<{ success: boolean; data?: VariantCombination | null; error?: unknown }>;
export function getCombinationById(combinationId: string): Promise<{ success: boolean; data?: VariantCombination; error?: unknown }>;
export function calculateCombinationPrice(basePrice: number, combinationAdjustment?: number): number;
export function formatCombinationDisplay(variantValues: Record<string, string> | null): string;
export function createCombinationSnapshot(combination: VariantCombination | null): { combination_id: string; variant_values: Record<string, string>; price_adjustment: number; sku?: string | null } | null;
export function productHasCombinations(productId: string): Promise<boolean>;
export function getTotalCombinationStock(productId: string): Promise<number>;
export function createCombination(combinationData: Partial<VariantCombination>): Promise<{ success: boolean; data?: VariantCombination; error?: unknown }>;
export function updateCombination(id: string, updates: Partial<VariantCombination>): Promise<{ success: boolean; data?: VariantCombination; error?: unknown }>;
export function deleteCombination(id: string): Promise<{ success: boolean; error?: unknown }>;
export function generateCombinations(variantsByType: Record<string, Array<{ variant_value: string; price_adjustment?: number }>>): Array<{ variant_values: Record<string, string>; price_adjustment: number }>;

