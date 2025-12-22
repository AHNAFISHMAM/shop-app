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

export declare function searchFoodPhotos(query: string, options?: SearchFoodPhotosOptions): Promise<SearchFoodPhotosResult>;

