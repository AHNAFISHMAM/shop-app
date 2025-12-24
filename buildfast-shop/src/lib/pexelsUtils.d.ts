export interface PexelsImageUrlOptions {
  width?: number
  height?: number
  format?: string
  params?: Record<string, string>
}

export function extractPhotoId(url: string | null | undefined): string | null
export function buildPexelsImageUrl(
  photoId: string | number,
  options?: PexelsImageUrlOptions
): string
