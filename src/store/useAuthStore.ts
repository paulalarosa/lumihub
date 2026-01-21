import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
    theme: 'noir';

    // Actions
    login: () => Promise<void>; // Trigger Google Login
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            session: null,
            loading: true,
            error: null,
            theme: 'noir',

            login: async () => {
                set({ loading: true, error: null });
                try {
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: `${window.location.origin}/auth/callback`,
                        },
                    });
                    if (error) throw error;
                } catch (error: any) {
                    set({ error: error.message });
                } finally {
                    set({ loading: false });
                }
            },

            logout: async () => {
                set({ loading: true });
                try {
                    await supabase.auth.signOut();
                    set({ user: null, session: null, error: null });
                } catch (error: any) {
                    set({ error: error.message });
                } finally {
                    set({ loading: false });
                }
            },

            checkSession: async () => {
                set({ loading: true });
                try {
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (error) throw error;

                    if (session) {
                        set({ session, user: session.user });
                    } else {
                        set({ session: null, user: null });
                    }
                } catch (error: any) {
                    set({ error: error.message, session: null, user: null });
                } finally {
                    set({ loading: false });
                }
            },

            setLoading: (loading: boolean) => set({ loading }),
        }),
        {
            name: 'auth-storage', // unique name for localStorage
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ session: state.session, user: state.user, theme: state.theme }), // persist specific fields
        }
    )
);
