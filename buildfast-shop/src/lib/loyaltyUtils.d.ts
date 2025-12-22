interface LoyaltySnapshot {
    tier: string;
    currentPoints: number;
    nextTierThreshold: number;
    nextTierLabel: string;
    pointsMultiplier: number;
}
interface Reward {
    id: string;
    label: string;
    cost: number;
}
export declare const resolveLoyaltyState: (orderTotal?: number) => {
    snapshot: LoyaltySnapshot;
    pointsEarnedThisOrder: number;
    projectedPoints: number;
    nextTierThreshold: number;
    progressPercent: number;
    pointsToNextTier: number;
    redeemableRewards: Reward[];
    newlyUnlockedRewards: Reward[];
};
export declare const getRewardsCatalog: () => Reward[];
export declare const redeemReward: (rewardId: string) => {
    success: boolean;
    message?: string;
};
export declare const resolveReferralInfo: (user: any) => {
    referralCode: string | null;
    referralCount: number;
    referralRewards: number;
};
