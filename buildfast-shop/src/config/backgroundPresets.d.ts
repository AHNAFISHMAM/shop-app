export interface ColorPreset {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface GradientPreset {
  id: string;
  name: string;
  gradient: string;
  description: string;
}

export interface ImagePreset {
  id: string;
  name: string;
  url: string;
  description: string;
}

export const solidColorPresets: ColorPreset[];
export const gradientPresets: GradientPreset[];
export const restaurantInteriorImages: ImagePreset[];
export const tableSettingsImages: ImagePreset[];
export const subtleTextureImages: ImagePreset[];
export const additionalImages: ImagePreset[];
export const imagePresets: ImagePreset[];
export function getPresetsByType(type: string): unknown[];
export function findPresetById(id: string): unknown | undefined;
export function getPresetPreview(preset: unknown): Record<string, string>;
