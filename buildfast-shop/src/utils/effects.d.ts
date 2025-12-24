export interface EffectOption {
  value: string
  label: string
  description: string
}

export const EFFECT_OPTIONS: EffectOption[]
export const MAX_EFFECTS_PER_ROUND: number
export const CAPTION_EFFECT_KEYS: string[]

export function parseEffects(
  effectValue: string | string[] | null | undefined,
  fallback?: string
): string[]
export function parseEffectVariants(
  rawVariants: string | string[] | null | undefined,
  fallbackBase?: string[]
): string[][]
export function serializeEffectVariants(variantArray: unknown, fallbackBase?: string[]): string
export function buildEffectVariants(baseList: string[]): string[][]
