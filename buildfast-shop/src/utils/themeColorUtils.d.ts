export function calculateThemeColors(warmth: number, tint: number): {
  primary: string;
  secondary: string;
  accent: string;
  [key: string]: string;
};
export function applyThemeAdjustments(settings: Record<string, unknown>): void;

