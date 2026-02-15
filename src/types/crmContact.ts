// CRM Contact Type - For Gift Distribution Module
// This type represents contacts (people) at client companies who receive gifts

export interface CRMContact {
    id?: string;
    client_id: string;

    // Contact Information
    name: string;
    role: string;
    email: string;
    phone: string;
    is_main_contact?: boolean;

    // Gift Distribution Fields
    gift_type?: string;
    gift_other?: string;
    gift_quantity?: number;
    gift_history?: any[];
    gift_notes?: string;

    // Delivery Address (can be different from company address)
    address?: string;
    address_number?: string;
    address_complement?: string;
    neighborhood?: string;
    city?: string;
    uf?: string;
    zip_code?: string;

    // Timestamps
    created_at?: string;
    updated_at?: string;
    ignored_fields?: string[];

    // Relations (from JOIN)
    client?: {
        id: string;
        name: string; // Company name
        partner?: {
            id: string;
            name: string;
        };
    };
}

// Gift type options
export const GIFT_TYPES = [
    'Brinde VIP',
    'Brinde Médio',
    'Outro',
    'Não recebe'
] as const;

export type GiftType = typeof GIFT_TYPES[number];

// Helper to get gift badge color
export const getGiftBadgeColor = (giftType?: string): string => {
    if (!giftType) return 'bg-gray-100 text-gray-600 border-gray-200';

    switch (giftType) {
        case 'Brinde VIP':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'Brinde Médio':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Outro':
            return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Não recebe':
            return 'bg-gray-100 text-gray-500 border-gray-200';
        default:
            return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

// Helper to get gift icon gradient colors
export const getGiftIconColor = (giftType: string): string => {
    switch (giftType) {
        case 'Brinde VIP':
            return 'from-purple-500 to-purple-600';
        case 'Brinde Médio':
            return 'from-blue-500 to-blue-600';
        case 'Outro':
            return 'from-amber-500 to-amber-600';
        case 'Não recebe':
            return 'from-gray-400 to-gray-500';
        default:
            return 'from-green-500 to-emerald-600';
    }
};

