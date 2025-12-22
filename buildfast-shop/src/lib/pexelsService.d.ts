export interface PexelsPhoto {
    id: string;
    previewUrl: string;
    src: Record<string, string>;
    photographer?: string;
    original?: any;
}

export interface SearchFoodPhotosOptions {
    perPage?: number;
    page?: number;
}

export interface SearchFoodPhotosResult {
    photos: PexelsPhoto[];
    totalResults: number;
    nextPage: number | null;
}

export interface BuildMenuImageUrlOptions {
    width?: number;
    height?: number;
    format?: string;
    params?: Record<string, string>;
}

export declare function searchFoodPhotos(query: string, options?: SearchFoodPhotosOptions): Promise<SearchFoodPhotosResult>;
export declare function buildMenuImageUrl(photoId: string | number, options?: BuildMenuImageUrlOptions): string;
