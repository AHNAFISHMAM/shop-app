export declare const getCartItemNotes: () => Record<string, string>;
export declare const saveCartItemNote: (itemId: string, note: string) => {
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
};
export declare const getCartItemNote: (itemId: string) => string | null;
export declare const removeCartItemNote: (itemId: string) => {
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
};
export declare const getSavedForLaterItems: () => any[];
export declare const saveForLater: (item: any) => {
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
};
export declare const moveToCart: (itemId: string) => {
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
};
export declare const removeFromSavedForLater: (itemId: string) => {
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: any;
};
export declare const saveItemForLater: (item: any) => {
    success: boolean;
    error?: any;
};
export declare const saveSelectedReward: (reward: any) => {
    success: boolean;
    error?: any;
};
