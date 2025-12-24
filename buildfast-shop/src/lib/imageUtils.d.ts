export declare function validateImage(file: File): {
  valid: boolean
  errors: string[]
}
export declare function uploadImage(
  file: File,
  path: string,
  bucket?: string
): Promise<{
  success: boolean
  url: string | null
  error: string | null
}>
export declare function deleteImage(
  url: string,
  bucket?: string
): Promise<{
  success: boolean
  error: string | null
}>
export declare function getPublicUrl(path: string, bucket?: string): string
export declare function getImageUrlFromPath(path: string, bucket?: string): string
export declare function getFileNameFromUrl(url: string): string | null
export declare function getFilePathFromUrl(url: string, bucket?: string): string | null
export declare function getFileExtension(filename: string): string | null
export declare function getFileBaseName(filename: string): string | null
export declare function getCroppedImageUrl(
  originalUrl: string,
  cropParams: {
    x: number
    y: number
    width: number
    height: number
  },
  targetWidth?: number,
  targetHeight?: number
): string
export declare function getResizedImageUrl(
  originalUrl: string,
  width: number,
  height?: number
): string
export declare function getOptimizedImageUrl(
  originalUrl: string,
  quality?: number,
  format?: string
): string
export declare function getPlaceholderImage(width?: number, height?: number): string
export declare function uploadMenuImage(
  file: File,
  dishName: string,
  metadata?: Record<string, any>
): Promise<{
  success: boolean
  url: string | null
  error: string | null
  duplicate?: boolean
}>
export declare function uploadMultipleImages(files: File[]): Promise<
  Array<{
    success: boolean
    url: string | null
    error: string | null
    fileName?: string
    duplicate?: boolean
  }>
>
export declare function generatePlaceholderImage(dishName: string, color?: string): string
export interface AutoMatchResult {
  matches: Array<{ fileName: string; [key: string]: unknown }>
  unmatched: Array<{ fileName: string; [key: string]: unknown }>
}
export declare function autoMatchImages(
  uploadedFiles: Array<{ fileName: string; [key: string]: unknown }>,
  menuItems: Array<{ id: string; name: string; [key: string]: unknown }>
): Promise<AutoMatchResult>
export declare function compressImage(
  file: File,
  maxWidth?: number,
  quality?: number
): Promise<File>
