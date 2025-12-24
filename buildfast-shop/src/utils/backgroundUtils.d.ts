export interface BackgroundSettings {
  [key: string]: string | null | undefined
}

export interface BackgroundStyle {
  background?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  backgroundAttachment?: string
  [key: string]: string | undefined
}

export function getBackgroundStyle(
  settings: BackgroundSettings | null,
  section: string
): BackgroundStyle
export function getBackgroundStyleString(
  settings: BackgroundSettings | null,
  section: string
): string
export function isValidHexColor(color: string): boolean
export function isValidGradient(gradient: string): boolean
export function isValidImageUrl(url: string): boolean
export function validateBackgroundConfig(config: unknown): { isValid: boolean; errors: string[] }
export function getDefaultBackgroundConfig(section: string): {
  type: string
  color: string | null
  gradient: string | null
  imageUrl: string | null
}
export function configToDbFormat(config: unknown, section: string): Record<string, unknown>
export function dbFormatToConfig(
  dbData: Record<string, unknown>,
  section: string
): {
  type: string
  color: string | null
  gradient: string | null
  imageUrl: string | null
}
export function getOverlayStyle(
  overlayColor?: string,
  overlayOpacity?: number
): Record<string, unknown>
export function isDarkBackground(color: string): boolean
export function getRecommendedTextColor(backgroundStyle: Record<string, unknown>): string
