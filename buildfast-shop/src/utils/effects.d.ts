/**
 * Type declarations for effects utilities
 */
export interface EffectOption {
  value: string;
  label: string;
  description: string;
}

export const EFFECT_OPTIONS: EffectOption[];
export const CAPTION_EFFECT_KEYS: string[];
export const SUPPORTED_EFFECT_KEYS: string[];
export const MAX_EFFECTS_PER_ROUND: number;

export function parseEffects(effectValue: string | string[], fallback?: string): string[];
export function validateEffect(effect: string): boolean;
export function getEffectLabel(effect: string): string;

