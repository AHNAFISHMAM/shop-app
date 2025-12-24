export interface Meal {
  image_url?: string | null;
  images?: string[];
  id?: string;
  [key: string]: unknown;
}

export function getMealImageUrl(meal: Meal | null | undefined): string;
export function getMealImages(meal: Meal | null | undefined): string[];

