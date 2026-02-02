export interface Profile {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    slug: string;
    business_address: string | null;
    full_name: string | null;
}

export interface Service {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration_minutes: number;
}

export interface TimeSlot {
    time: string;
    available: boolean;
}
