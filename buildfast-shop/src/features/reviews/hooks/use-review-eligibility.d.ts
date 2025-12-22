export declare function useReviewEligibility(user: any, productId: string, reviewsEnabled?: boolean): {
    canReview: boolean;
    hasReviewed: boolean;
    isLoading: boolean;
    error: string | null;
};
