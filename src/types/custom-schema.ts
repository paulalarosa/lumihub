import { Database } from '@/integrations/supabase/types';

// Extend the Database interface to include missing tables if needed, 
// or define loose types for them. Since we can't easily extend the types.ts directly
// we will define local interfaces that mimic the structure.

export interface GeoCacheEntry {
    query: string;
    response: {
        geometry: {
            location: {
                lat: number;
                lng: number;
            }
        }
    };
    expires_at?: string;
}

export interface AssistantInvite {
    id: string;
    email: string;
    owner_id: string;
    invite_code: string;
    status: 'pending' | 'accepted' | 'revoked';
    created_at: string;
    token?: string; // Legacy?
}

// Database helper to treat these tables as if they existed
export type CustomDatabase = Database & {
    public: {
        Tables: {
            geo_cache: {
                Row: GeoCacheEntry;
                Insert: GeoCacheEntry;
                Update: Partial<GeoCacheEntry>;
            };
            assistant_invites: {
                Row: AssistantInvite;
                Insert: AssistantInvite;
                Update: Partial<AssistantInvite>;
            };
        }
    }
}
