/**
 * Type declarations for reviews API
 */
export interface FetchReviewsOptions {
  itemType?: 'product' | 'menu_item' | 'all';
  sortBy?: 'recent' | 'highest' | 'lowest';
  limit?: number;
  offset?: number;
  source?: string;
}

export interface ReviewResult {
  success: boolean;
  data?: any[];
  error?: string | null;
  count?: number;
}

export function fetchProductReviews(itemId: string, options?: FetchReviewsOptions): Promise<ReviewResult>;
export function submitReview(reviewData: any): Promise<ReviewResult>;
export function updateReview(reviewId: string, updates: any): Promise<ReviewResult>;
export function deleteReview(reviewId: string): Promise<ReviewResult>;
export function fetchFavoriteComments(): Promise<ReviewResult>;
export function toggleFavoriteComment(commentId: string): Promise<ReviewResult>;

