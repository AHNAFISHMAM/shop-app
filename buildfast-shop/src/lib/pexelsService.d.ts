export interface PexelsPhoto {
  id: string;
  previewUrl: string;
  src: Record<string, string>;
  photographer?: string;
  original?: unknown;
}

export interface PexelsSearchOptions {
  perPage?: number;
  page?: number;
}

export interface PexelsSearchResult {
  photos: PexelsPhoto[];
  totalResults: number;
  nextPage: number | null;
}

export function searchFoodPhotos(query: string, options?: PexelsSearchOptions): Promise<PexelsSearchResult>;
export function buildMenuImageUrl(photoId: string | number, options?: { width?: number; height?: number; format?: string; [key: string]: unknown }): string;

