export interface Microsite {
    id: string;
    user_id: string;
    slug: string;
    business_name: string;
    tagline?: string;
    logo_url?: string;
    cover_image_url?: string;
    primary_color?: string;
    secondary_color?: string;
    about_text?: string;
    services?: any[]; // JSONB
    portfolio_images?: string[];
    testimonials?: any[]; // JSONB
    phone?: string;
    email?: string;
    instagram_handle?: string;
    whatsapp_link?: string;
    address?: string;
    meta_title?: string;
    meta_description?: string;
    show_prices?: boolean;
    enable_booking?: boolean;
    is_published?: boolean;
    custom_domain?: string;
    view_count?: number;
    created_at?: string;
    updated_at?: string;
}
