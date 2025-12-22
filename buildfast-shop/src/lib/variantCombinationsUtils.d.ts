export interface CombinationResult {
    success: boolean;
    data?: any;
    error?: any;
}

export declare function getProductCombinations(productId: string): Promise<CombinationResult>;
export declare function findCombinationByValues(productId: string, variantValues: Record<string, string>): Promise<CombinationResult>;
export declare function getCombinationById(combinationId: string): Promise<CombinationResult>;
export declare function createCombination(combinationData: any): Promise<CombinationResult>;
export declare function updateCombination(combinationId: string, updates: any): Promise<CombinationResult>;
export declare function deleteCombination(combinationId: string): Promise<CombinationResult>;

