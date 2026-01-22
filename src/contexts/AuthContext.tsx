import React, { createContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Define context type for better safety
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>('professional'); // Default to professional to prevent redirects

    // Use ref to track internal state changes and avoid dependency loops
    const lastUserId = useRef<string | null>(null);

    // Helper: Fetch Role with Fallback
    const fetchRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                // console.warn("Auth: Error fetching role, defaulting to professional.", error);
                return 'professional';
            }

            // Default to professional to be safe if column is null
            const safeData = data as any;
            return safeData?.role || 'professional';
        } catch (err) {
            // console.error("Auth: Crash fetching role", err);
            return 'professional';
        }
    };

    useEffect(() => {
        let mounted = true;

        const handleSession = async (currentSession: Session | null) => {
            if (!mounted) return;

            const currentId = currentSession?.user?.id ?? null;

            // OPTIMIZATION: If user ID hasn't changed, don't trigger full reload logic
            // But ensure loading is resolved
            if (currentId === lastUserId.current) {
                setSession(currentSession);
                if (loading) setLoading(false);
                return;
            }

            // START LOADING
            setLoading(true);
            lastUserId.current = currentId;

            if (currentSession?.user) {
                // 1. Update basic auth
                setSession(currentSession);
                setUser(currentSession.user);

                // 2. Fetch Role
                const userRole = await fetchRole(currentSession.user.id);

                // 3. FINISH
                if (mounted) {
                    setRole(userRole);
                    setLoading(false);
                }
            } else {
                // 1. Clear everything
                setSession(null);
                setUser(null);
                setRole(null);

                // 2. FINISH
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        // Initialize
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.warn("Auth: Session init error", error);
                if (error.message.includes("Invalid Refresh Token")) {
                    signOut();
                    navigate('/login');
                    return;
                }
            }
            handleSession(session);
        }).catch(err => {
            console.error("Auth: Critical session init error", err);
            signOut();
        });

        // Subscribe
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {

            // CRITICAL: Handle invalid refresh token automatically
            if ((event as string) === 'TOKEN_REFRESH_ERROR') {
                console.warn('Auth: Token refresh error detected. Clearing session.');
                await signOut();
                navigate('/login');
                return;
            }

            handleSession(session);

            if (event === 'SIGNED_IN' && session) {
                // Remove hash from URL to clean access_token
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }

                // Redirect if on public pages
                if (window.location.pathname === '/login' || window.location.pathname === '/' || window.location.pathname === '/auth/login') {
                    // Check callback logic or default to dashboard
                    navigate('/dashboard');
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Standard Functions exposed
    const signIn = (email: string, pass: string) => supabase.auth.signInWithPassword({ email, password: pass });

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();

        setRole(null);
        setUser(null);
        setSession(null);
        lastUserId.current = null;
        setLoading(false);
    };

    const getRedirectUrl = () => {
        if (window.location.hostname === 'localhost') {
            return `${window.location.origin}/auth/callback`;
        }
        return 'https://khaoskontrol.com.br/auth/callback';
    };

    const signInWithGoogle = () => supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: getRedirectUrl(),
            scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        }
    });
    const signUp = (email: string, pass: string) => supabase.auth.signUp({ email, password: pass });

    const isAdmin = role === 'studio' || role === 'admin';

    return (
        <AuthContext.Provider value={{ user, session, loading, role, signIn, signOut, signInWithGoogle, signUp, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}
