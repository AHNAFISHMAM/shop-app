export declare const EFFECT_OPTIONS: {
    value: string;
    label: string;
    description: string;
}[];
export declare const CAPTION_EFFECT_KEYS: string[];
export declare const SUPPORTED_EFFECT_KEYS: string[];
export declare const MAX_EFFECTS_PER_ROUND = 3;
export declare function parseEffects(effectValue: string | string[], fallback?: string): string[];
export declare function getRandomEffects(count?: number, exclude?: string[]): string[];
export declare function parseEffectVariants(rawVariants: string | string[], fallbackBase?: string[]): string[][];
export declare function buildEffectVariants(baseList: string | string[]): string[][];
