/**
 * Type declarations for background presets
 */
export interface Preset {
  id: string;
  name: string;
  description: string;
  color?: string;
  gradient?: string;
  url?: string;
  category?: string;
  source?: string;
}

export const solidColorPresets: Preset[];
export const gradientPresets: Preset[];
export const restaurantInteriorImages: Preset[];
export const tableSettingsImages: Preset[];
export const subtleTextureImages: Preset[];
export const additionalImages: Preset[];
export const imagePresets: Preset[];

export function getPresetsByType(type: 'solid' | 'gradient' | 'image'): Preset[];
export function findPresetById(id: string): Preset | undefined;
export function getPresetPreview(preset: Preset): Record<string, string>;

