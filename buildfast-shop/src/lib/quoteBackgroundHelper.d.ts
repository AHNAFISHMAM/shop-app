export interface Settings {
  hero_quote_bg_url?: string | null;
  [key: string]: unknown;
}

export function getQuoteBackgroundUrl(settings: Settings | null | undefined): string;

