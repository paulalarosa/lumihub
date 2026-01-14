export type UserRole = 'admin' | 'user';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    onboarding_completed: boolean;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

export interface Client {
    id: string;
    user_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    instagram: string | null;
    avatar_url: string | null;
    notes: string | null;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    user_id: string;
    client_id: string;
    name: string;
    status: 'lead' | 'contact' | 'proposal' | 'contract' | 'active' | 'completed' | 'cancelled';
    event_date: string | null;
    event_type: string | null;
    event_location: string | null;
    notes: string | null;
    public_token: string | null;
    created_at: string;
    updated_at: string;
}

export interface Contract {
    id: string;
    project_id: string;
    user_id: string;
    title: string;
    content: string;
    status: 'draft' | 'sent' | 'signed' | 'cancelled';
    signed_at: string | null;
    signature_data: string | null;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    user_id: string;
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    created_at: string;
    updated_at: string;
}

export interface Assistant {
    id: string;
    user_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    invite_token: string | null;
    is_registered: boolean;
    assistant_user_id: string | null;
    has_pro_access: boolean;
    created_at: string;
    updated_at: string;
}
