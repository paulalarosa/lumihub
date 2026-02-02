import { User, Session, AuthResponse, OAuthResponse } from '@supabase/supabase-js';

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: string | null;
    signIn: (email: string, pass: string) => Promise<AuthResponse>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<OAuthResponse>;
    signUp: (email: string, pass: string) => Promise<AuthResponse>;
    isAdmin?: boolean;
}
