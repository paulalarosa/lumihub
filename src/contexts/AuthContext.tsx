import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Logger } from '@/services/logger';

import { AuthContextType } from '@/types/auth';
import { AuthContext } from '@/contexts/AuthContextDefinition';

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
            const safeData = data as { role?: string };
            return safeData?.role || 'professional';
        } catch (err) {
            // console.error("Auth: Crash fetching role", err);
            return 'professional';
        }
    };



    // Standard Functions exposed - Memoized to prevent effect loops
    const signIn = useCallback((email: string, pass: string) => supabase.auth.signInWithPassword({ email, password: pass }), []);

    const signOut = useCallback(async () => {
        if (user) {
            Logger.action("USER_SIGN_OUT", user.id, "auth.users", user.id);
        }
        setLoading(true);
        await supabase.auth.signOut();

        setRole(null);
        setUser(null);
        setSession(null);
        lastUserId.current = null;
        setLoading(false);
    }, [user]);

    const getRedirectUrl = () => {
        // Handle localhost development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return `${window.location.origin}/auth/callback`;
        }

        // Handle specific production domain or fallback to current origin for staging/previews
        const domain = window.location.hostname.endsWith('khaoskontrol.com.br')
            ? 'https://khaoskontrol.com.br'
            : window.location.origin;

        return `${domain}/auth/callback`;
    };

    const signInWithGoogle = useCallback(() => supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: getRedirectUrl(),
            scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        }
    }), []);

    const signUp = useCallback((email: string, pass: string) => supabase.auth.signUp({ email, password: pass }), []);

    const isAdmin = role === 'studio' || role === 'admin';

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
                // Audit Sign In
                Logger.action("USER_SIGN_IN", currentSession.user.id, "auth.users", currentSession.user.id);

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
                if (window.location.pathname === '/login' || window.location.pathname === '/auth/login' || window.location.pathname === '/register') {
                    // Check callback logic or default to dashboard
                    navigate('/dashboard');
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [navigate, signOut]);

    return (
        <AuthContext.Provider value={{ user, session, loading, role, signIn, signOut, signInWithGoogle, signUp, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}
