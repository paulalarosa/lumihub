import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: string | null;
    signIn: (email: string, pass: string) => Promise<any>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<any>;
    signUp: (email: string, pass: string) => Promise<any>;
    isAdmin?: boolean;
}
