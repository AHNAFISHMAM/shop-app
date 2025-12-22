/**
 * Type declarations for background utility functions
 */
export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image' | 'none';
  color?: string | null;
  gradient?: string | null;
  imageUrl?: string | null;
}

export interface BackgroundValidationResult {
  isValid: boolean;
  errors: string[];
}

export function getBackgroundStyle(settings: Record<string, any>, section: string): Record<string, string>;
export function getBackgroundStyleString(settings: Record<string, any>, section: string): string;
export function isValidHexColor(color: string): boolean;
export function isValidGradient(gradient: string): boolean;
export function isValidImageUrl(url: string): boolean;
export function validateBackgroundConfig(config: BackgroundConfig): BackgroundValidationResult;
export function getDefaultBackgroundConfig(section: string): BackgroundConfig;
export function configToDbFormat(config: BackgroundConfig, section: string): Record<string, string | null>;
export function dbFormatToConfig(dbData: Record<string, any>, section: string): BackgroundConfig;
export function getOverlayStyle(overlayColor?: string, overlayOpacity?: number): Record<string, any>;
export function isDarkBackground(color: string): boolean;
export function getRecommendedTextColor(backgroundStyle: Record<string, string>): string;

