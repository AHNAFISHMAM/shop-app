/**
 * Type declarations for image utilities
 */
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function validateImage(file: File): ImageValidationResult;
export function uploadImage(file: File, path?: string): Promise<ImageUploadResult>;
export function deleteImage(url: string): Promise<{ success: boolean; error?: string }>;
export function getImageUrl(path: string): string;

