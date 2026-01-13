import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  isAssistant: boolean;
  signUp: (email: string, password: string, fullName?: string, businessName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isAssistant, setIsAssistant] = useState(false);

  const checkIfAssistant = async (userId: string) => {
    const { data, error } = await supabase
      .from('assistants')
      .select('id')
      .eq('assistant_user_id', userId)
      .maybeSingle();

    setIsAssistant(!error && !!data);
  };

  const fetchRoles = async (userId: string, email?: string) => {
    try {
      console.log("Auth Debug: Fetching profile for", userId, email);
      const { data, error } = await supabase
        .from('profiles')
        .select('role, plan')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Auth Debug: Error fetching profile", error);
      }

      console.log("Auth Debug: Profile data", data);

      const fetchedRoles: AppRole[] = [];
      if (data?.role === 'admin') fetchedRoles.push('admin');

      // Hardcoded admin override for testing
      if (email === 'prenata@gmail.com') {
        console.log("Auth Debug: Applying email override for admin");
        if (!fetchedRoles.includes('admin')) fetchedRoles.push('admin');
      }

      setRoles(fetchedRoles);
    } catch (e) {
      console.error("Auth Debug: Unexpected error", e);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchRoles(session.user.id, session.user.email);
            checkIfAssistant(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setIsAssistant(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id, session.user.email);
        checkIfAssistant(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, businessName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
          business_name: businessName || ''
        }
      }
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly',
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setIsAssistant(false);
  };

  const isAdmin = roles.includes('admin');

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      roles,
      isAdmin,
      isAssistant,
      signUp,
      signIn,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
