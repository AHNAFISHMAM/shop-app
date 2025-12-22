export interface BuildPexelsImageUrlOptions {
    width?: number;
    height?: number;
    format?: string;
    params?: Record<string, string>;
}

export declare function extractPhotoId(url: string | null | undefined): string | null;
export declare function buildPexelsImageUrl(photoId: string | number, options?: BuildPexelsImageUrlOptions): string;

