
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  isAssistant: boolean;
  checkIfAssistant: (userId: string) => Promise<void>;
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
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    // @ts-ignore
    const userRole = data?.role;

    const fetchedRoles: AppRole[] = [];
    if (userRole === 'admin') fetchedRoles.push('admin');

    if (email === 'prenata@gmail.com') {
      if (!fetchedRoles.includes('admin')) fetchedRoles.push('admin');
    }

    setRoles(fetchedRoles);
  };

  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

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

    AuthService.getSession().then(({ data: { session } }) => {
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
        scopes: 'https://www.googleapis.com/auth/calendar',
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
    await AuthService.signOut();
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
      checkIfAssistant,
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
