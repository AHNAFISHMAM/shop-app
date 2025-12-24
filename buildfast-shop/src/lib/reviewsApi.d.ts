export interface ReviewOptions {
  itemType?: string
  sortBy?: string
  limit?: number
  offset?: number
  source?: string
}

export interface ReviewResult {
  success: boolean
  reviews?: unknown[]
  data?: unknown[]
  count?: number
  error?: string | Error
  alreadyExists?: boolean
  tableMissing?: boolean
  permissionDenied?: boolean
  message?: string
  code?: string
  [key: string]: unknown
}

export interface AdminFavoriteReviewsOptions {
  timeframe?: string
  limit?: number
}

export interface CreateReviewData {
  productId?: string
  menuItemId?: string
  itemType?: string
  userId: string
  orderId?: string | null
  orderItemId?: string | null
  rating?: number | null
  reviewText?: string
  reviewImages?: string[]
  source?: string
  favoriteIsGeneral?: boolean
  favoriteTargetLabel?: string | null
  [key: string]: unknown
}

export function fetchProductReviews(itemId: string, options?: ReviewOptions): Promise<ReviewResult>
export function fetchAdminFavoriteReviews(
  options?: AdminFavoriteReviewsOptions
): Promise<ReviewResult>
export interface UserFavoriteReviewsResult {
  success: boolean
  data?: unknown[]
  error?: string
  [key: string]: unknown
}
export function fetchUserFavoriteReviews(options?: {
  userId?: string
  timeframe?: string
}): Promise<UserFavoriteReviewsResult>
export function createReview(data: CreateReviewData): Promise<ReviewResult>
export function uploadReviewImage(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: Error | string }>
export function getProductRatingStats(itemId: string): Promise<{
  success: boolean
  averageRating?: number
  totalReviews?: number
  ratingDistribution?: Record<number, number>
  error?: string
}>
export function getProductRatingDistribution(itemId: string): Promise<{
  success: boolean
  distribution?: Record<number, number>
  data?: Record<number, number>
  error?: string
}>
export function canUserReviewProduct(
  productId: string,
  userId: string
): Promise<{ canReview: boolean; reason?: string }>
export function updateReview(
  reviewId: string,
  updates?: { rating?: number; reviewText?: string; reviewImages?: string[] }
): Promise<ReviewResult>
export function updateReviewStatus(reviewId: string, status: string): Promise<ReviewResult>
export function deleteReview(reviewId: string): Promise<ReviewResult>
export function fetchAllReviews(options?: {
  filter?: string
  sortBy?: string
  limit?: number
  offset?: number
  source?: string
}): Promise<ReviewResult>
export function hideReview(reviewId: string): Promise<ReviewResult>
export function unhideReview(reviewId: string): Promise<ReviewResult>
