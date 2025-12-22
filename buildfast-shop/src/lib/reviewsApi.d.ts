export declare function fetchProductReviews(itemId: string, options?: {
    itemType?: 'product' | 'menu_item' | 'all';
    sortBy?: 'recent' | 'highest' | 'lowest';
    limit?: number;
    offset?: number;
    source?: string;
}): Promise<{
    success: boolean;
    data: any[] | null;
    error: string | null;
    count?: number;
}>;
export declare function submitReview(reviewData: {
    product_id?: string;
    menu_item_id?: string;
    user_id: string;
    rating: number;
    comment: string;
    source?: string;
}): Promise<{
    success: boolean;
    data: any | null;
    error: string | null;
}>;
export declare function updateReview(reviewId: string, updates: Partial<{
    rating: number;
    comment: string;
    is_hidden: boolean;
}>): Promise<{
    success: boolean;
    data: any | null;
    error: string | null;
}>;
export declare function deleteReview(reviewId: string): Promise<{
    success: boolean;
    error: string | null;
}>;
export declare function fetchReviewsSummary(itemId: string, itemType?: 'product' | 'menu_item' | 'all'): Promise<{
    success: boolean;
    data: {
        average_rating: number;
        total_reviews: number;
        rating_counts: Record<number, number>;
    } | null;
    error: string | null;
}>;
export declare function fetchFavoriteComments(): Promise<{
    success: boolean;
    data: any[] | null;
    error: string | null;
}>;
export declare function addFavoriteComment(comment: string): Promise<{
    success: boolean;
    data: any | null;
    error: string | null;
}>;
export declare function removeFavoriteComment(commentId: string): Promise<{
    success: boolean;
    error: string | null;
}>;
export declare function createReview(reviewData: {
    product_id?: string;
    menu_item_id?: string;
    user_id: string;
    rating: number;
    comment: string;
    source?: string;
    image_url?: string;
}): Promise<{
    success: boolean;
    data: any | null;
    error: string | null;
}>;
export declare function uploadReviewImage(file: File, userId: string): Promise<{
    success: boolean;
    url: string | null;
    error: string | null;
}>;
export declare function fetchUserFavoriteReviews(options?: {
    userId?: string;
    timeframe?: 'current' | 'all';
}): Promise<{
    success: boolean;
    data: any[] | null;
    error: string | null;
}>;
export declare function getProductRatingStats(itemId: string): Promise<{
    success: boolean;
    data: {
        average_rating: number;
        total_reviews: number;
        rating_counts: Record<number, number>;
    } | null;
    error: string | null;
}>;
export declare function getProductRatingDistribution(itemId: string): Promise<{
    success: boolean;
    data: Record<number, number> | null;
    error: string | null;
}>;
export declare function fetchAdminFavoriteReviews(): Promise<{
    success: boolean;
    data: any[] | null;
    error: string | null;
}>;
