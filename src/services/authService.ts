import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export const AuthService = {
    async getSession() {
        return await supabase.auth.getSession();
    },

    async getUser() {
        return await supabase.auth.getUser();
    },

    async signOut() {
        return await supabase.auth.signOut();
    },

    async getProfile(userId: string) {
        return await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
    },

    async updateProfile(userId: string, updates: Database['public']['Tables']['profiles']['Update']) {
        return await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
    },

    onAuthStateChange(callback: (event: any, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }
};
